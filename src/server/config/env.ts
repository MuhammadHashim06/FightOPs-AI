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
  databaseUrl: process.env.DATABASE_URL ?? "",
  databaseName: process.env.DATABASE_NAME ?? "fightops",
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? "587"),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "no-reply@fightops.ai",
};
