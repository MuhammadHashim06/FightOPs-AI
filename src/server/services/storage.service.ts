import { createHmac, createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { env } from "@/server/config/env";

type UploadInput = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  scope: string;
};

type UploadResult = {
  provider: "local" | "r2";
  key: string;
  publicUrl: string | null;
};

export async function uploadObject(input: UploadInput): Promise<UploadResult> {
  const key = buildStorageKey(input.scope, input.fileName);

  if (env.storageProvider === "r2") {
    return uploadToR2({
      key,
      buffer: input.buffer,
      mimeType: input.mimeType,
    });
  }

  return uploadToLocal({
    key,
    buffer: input.buffer,
  });
}

function buildStorageKey(scope: string, fileName: string) {
  const safeScope = scope.replace(/[^a-zA-Z0-9/_-]+/g, "-");
  const extension = path.extname(fileName).toLowerCase();
  const baseName = path
    .basename(fileName, extension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${safeScope}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${baseName || "file"}${extension}`;
}

async function uploadToLocal(input: {
  key: string;
  buffer: Buffer;
}): Promise<UploadResult> {
  const uploadRoot = path.join(process.cwd(), "storage", "uploads");
  const destination = path.join(uploadRoot, input.key);

  if (!destination.startsWith(uploadRoot)) {
    throw new Error("Invalid upload path.");
  }

  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, input.buffer);

  return {
    provider: "local",
    key: input.key,
    publicUrl: null,
  };
}

async function uploadToR2(input: {
  key: string;
  buffer: Buffer;
  mimeType: string;
}): Promise<UploadResult> {
  assertR2Configured();

  const host = `${env.r2AccountId}.r2.cloudflarestorage.com`;
  const endpoint = `https://${host}/${env.r2BucketName}/${encodeR2Key(input.key)}`;
  const signedHeaders = await signR2PutRequest({
    host,
    key: input.key,
    body: input.buffer,
    mimeType: input.mimeType,
  });

  const response = await fetch(endpoint, {
    method: "PUT",
    headers: signedHeaders,
    body: new Uint8Array(input.buffer),
  });

  if (!response.ok) {
    throw new Error(`R2 upload failed with status ${response.status}.`);
  }

  return {
    provider: "r2",
    key: input.key,
    publicUrl: env.r2PublicBaseUrl
      ? `${env.r2PublicBaseUrl.replace(/\/$/, "")}/${input.key}`
      : null,
  };
}

function assertR2Configured() {
  if (
    !env.r2AccountId ||
    !env.r2AccessKeyId ||
    !env.r2SecretAccessKey ||
    !env.r2BucketName
  ) {
    throw new Error("Cloudflare R2 storage is not configured.");
  }
}

async function signR2PutRequest(input: {
  host: string;
  key: string;
  body: Buffer;
  mimeType: string;
}) {
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = createHash("sha256").update(input.body).digest("hex");
  const canonicalUri = `/${env.r2BucketName}/${encodeR2Key(input.key)}`;
  const canonicalHeaders = [
    `content-type:${input.mimeType}`,
    `host:${input.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
    "",
  ].join("\n");
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");
  const signingKey = getSignatureKey(env.r2SecretAccessKey, dateStamp, "auto", "s3");
  const signature = createHmac("sha256", signingKey)
    .update(stringToSign)
    .digest("hex");

  return {
    "Content-Type": input.mimeType,
    Host: input.host,
    "X-Amz-Content-Sha256": payloadHash,
    "X-Amz-Date": amzDate,
    Authorization: `AWS4-HMAC-SHA256 Credential=${env.r2AccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

function getSignatureKey(secret: string, dateStamp: string, region: string, service: string) {
  const dateKey = createHmac("sha256", `AWS4${secret}`).update(dateStamp).digest();
  const dateRegionKey = createHmac("sha256", dateKey).update(region).digest();
  const dateRegionServiceKey = createHmac("sha256", dateRegionKey)
    .update(service)
    .digest();
  return createHmac("sha256", dateRegionServiceKey).update("aws4_request").digest();
}

function toAmzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function encodeR2Key(key: string) {
  return key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}
