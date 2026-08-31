const fallbackNodeEnv = "development";

export const env = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "FightsAI Ops",
  apiVersion: process.env.NEXT_PUBLIC_API_VERSION ?? "v1",
  nodeEnv: process.env.NODE_ENV ?? fallbackNodeEnv,
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  authSecret: process.env.AUTH_SECRET ?? "dev-auth-secret",
  authOtpExpiresInMinutes: Number(process.env.AUTH_OTP_EXPIRES_IN_MINUTES ?? "10"),
  authResetTokenExpiresInMinutes: Number(
    process.env.AUTH_RESET_TOKEN_EXPIRES_IN_MINUTES ?? "30",
  ),
  authRefreshTokenExpiresInDays: Number(
    process.env.AUTH_REFRESH_TOKEN_EXPIRES_IN_DAYS ?? "30",
  ),
  authFighterInviteExpiresInDays: Number(
    process.env.AUTH_FIGHTER_INVITE_EXPIRES_IN_DAYS ?? "7",
  ),
  databaseUrl: process.env.DATABASE_URL ?? "",
  databaseName: process.env.DATABASE_NAME ?? "fightops",
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? "587"),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "no-reply@fightops.ai",
  storageProvider: process.env.STORAGE_PROVIDER ?? "local",
  localUploadDir: process.env.LOCAL_UPLOAD_DIR ?? "storage/uploads",
  r2AccountId: process.env.R2_ACCOUNT_ID ?? "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  r2BucketName: process.env.R2_BUCKET_NAME ?? "",
  r2PublicBaseUrl: process.env.R2_PUBLIC_BASE_URL ?? "",
};
