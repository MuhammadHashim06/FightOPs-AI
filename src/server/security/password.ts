import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");

  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string) {
  if (!storedHash.includes(":")) {
    const legacyHash = createHash("sha256").update(password).digest("hex");
    return legacyHash === storedHash;
  }

  const [salt, expectedHash] = storedHash.split(":");
  const derivedKey = scryptSync(password, salt, 64);
  const expectedKey = Buffer.from(expectedHash, "hex");

  if (derivedKey.length !== expectedKey.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, expectedKey);
}
