import { listActivityLogEntries } from "@/server/services/activity.service";
import { listDocumentReviewQueue } from "@/server/services/document-submissions.service";
import { listAdminDashboardEvents } from "@/server/services/events.service";
import { listHumanActionCases } from "@/server/services/human-action.service";
import { authRepository } from "@/server/repositories/auth.repository";
import { env } from "@/server/config/env";
import type { AuthUser } from "@/types/auth";

export async function getAdminOverviewData(user: AuthUser) {
  if (user.role !== "admin") {
    throw new Error("Only admins can access the admin overview.");
  }

  const [events, reviewQueue, humanActionCases, activity] = await Promise.all([
    listAdminDashboardEvents(),
    listDocumentReviewQueue(user),
    listHumanActionCases(user),
    listActivityLogEntries(user),
  ]);

  return {
    events,
    stats: {
      totalEvents: events.length,
      activeEvents: events.filter((event) => event.status === "active").length,
      totalFights: events.reduce((total, event) => total + event.fights, 0),
      totalFighters: events.reduce((total, event) => total + event.fighters, 0),
      pendingDocuments: reviewQueue.filter((item) => item.status === "PENDING_REVIEW").length,
      humanActionCases: humanActionCases.length,
    },
    urgentEvents: events
      .filter((event) => event.humanActionItems > 0 || event.waitingItems > 0)
      .slice(0, 5),
    recentActivity: activity.slice(0, 5),
  };
}

export async function getAdminPlatformSettings(user: AuthUser) {
  if (user.role !== "admin") {
    throw new Error("Only admins can access platform settings.");
  }

  const [admins, promoters, fighters] = await Promise.all([
    authRepository.listUsersByRole("admin"),
    authRepository.listUsersByRole("promoter"),
    authRepository.listUsersByRole("fighter"),
  ]);

  return {
    environment: env.nodeEnv,
    integrations: [
      {
        name: "MongoDB",
        detail: env.databaseUrl ? "Database connection configured" : "DATABASE_URL is missing",
        ready: Boolean(env.databaseUrl),
      },
      {
        name: "SMTP email",
        detail: env.smtpHost && env.smtpUser && env.smtpPass
          ? "Email delivery credentials configured"
          : "SMTP credentials are incomplete",
        ready: Boolean(env.smtpHost && env.smtpUser && env.smtpPass),
      },
      {
        name: "Document storage",
        detail: env.storageProvider === "r2"
          ? env.r2AccountId && env.r2AccessKeyId && env.r2SecretAccessKey && env.r2BucketName
            ? "Cloudflare R2 is configured"
            : "Cloudflare R2 credentials are incomplete"
          : "Local development storage is active",
        ready:
          env.storageProvider === "local" ||
          Boolean(env.r2AccountId && env.r2AccessKeyId && env.r2SecretAccessKey && env.r2BucketName),
      },
      {
        name: "Reminder scheduler",
        detail: env.reminderCronSecret
          ? "Cron endpoint is protected and ready"
          : "REMINDER_CRON_SECRET is missing",
        ready: Boolean(env.reminderCronSecret),
      },
    ],
    accountCounts: {
      admins: admins.length,
      promoters: promoters.length,
      fighters: fighters.length,
    },
  };
}
