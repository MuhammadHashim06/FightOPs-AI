import { existsSync, readFileSync } from "node:fs";
import { randomBytes, scryptSync } from "node:crypto";
import mongoose from "mongoose";

loadEnvFile(".env");

const databaseUrl = process.env.DATABASE_URL;
const databaseName = process.env.DATABASE_NAME || "fightops";
const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_SEED_PASSWORD;
const firstName = process.env.ADMIN_SEED_FIRST_NAME?.trim() || "Platform";
const lastName = process.env.ADMIN_SEED_LAST_NAME?.trim() || "Admin";

if (!databaseUrl) {
  console.error("DATABASE_URL is not configured. Add it to .env before seeding.");
  process.exit(1);
}

if (!email || !password) {
  console.error(
    "ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are required. Add them to .env before seeding.",
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error("ADMIN_SEED_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

await mongoose.connect(databaseUrl, { dbName: databaseName });

try {
  const users = mongoose.connection.db.collection("users");
  const existingUser = await users.findOne({ email });

  if (existingUser && existingUser.role !== "admin") {
    throw new Error(
      `A non-admin account already exists for ${email}. Use a different ADMIN_SEED_EMAIL.`,
    );
  }

  const now = new Date();
  const user = {
    email,
    role: "admin",
    provider: "credentials",
    status: "active",
    emailVerifiedAt: now,
    passwordHash: hashPassword(password),
    profile: {
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
    },
    lastLoginAt: existingUser?.lastLoginAt ?? null,
    updatedAt: now,
  };

  if (existingUser) {
    await users.updateOne({ _id: existingUser._id }, { $set: user });
    console.log(`Admin account updated: ${email}`);
  } else {
    await users.insertOne({ ...user, createdAt: now });
    console.log(`Admin account created: ${email}`);
  }
} finally {
  await mongoose.disconnect();
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function hashPassword(value) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(value, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}
