import { existsSync, readFileSync } from "node:fs";
import mongoose from "mongoose";

loadEnvFile(".env");

const databaseUrl = process.env.DATABASE_URL;
const databaseName = process.env.DATABASE_NAME || "fightops";
const cleanupLegacyQueue = process.argv.includes("--cleanup-legacy-queue");

if (!databaseUrl) {
  console.error("DATABASE_URL is not configured. Add it to .env before migrating.");
  process.exit(1);
}

await mongoose.connect(databaseUrl, { dbName: databaseName });

try {
  const db = mongoose.connection.db;
  const fighterRequirements = db.collection("fighterrequirements");
  const eventRequirements = db.collection("eventrequirements");
  const fighters = db.collection("fighters");
  const reminderLogs = db.collection("reminderlogs");
  await Promise.all([
    fighterRequirements.createIndex({
      status: 1,
      nextReminderAt: 1,
      reminderLockedUntil: 1,
    }),
    fighterRequirements.createIndex({
      status: 1,
      nextDeadlineAlertAt: 1,
      reminderLockedUntil: 1,
    }),
  ]);
  const [requirementConfigs, fighterRecords, sentDeadlineAlerts] = await Promise.all([
    eventRequirements.find({ isActive: true }).toArray(),
    fighters.find({}).project({ managerEmail: 1, managerName: 1 }).toArray(),
    reminderLogs
      .find({ kind: "deadline_alert", status: "SENT" })
      .project({ fighterId: 1, eventRequirementId: 1, sentAt: 1 })
      .toArray(),
  ]);
  const configMap = new Map(
    requirementConfigs.map((item) => [item._id.toString(), item]),
  );
  const fighterMap = new Map(
    fighterRecords.map((item) => [item._id.toString(), item]),
  );
  const deadlineAlertMap = new Map(
    sentDeadlineAlerts.map((item) => [
      `${item.fighterId}:${item.eventRequirementId}`,
      item.sentAt ?? new Date(),
    ]),
  );
  const now = new Date();
  const operations = [];
  let migratedCount = 0;

  for await (const requirement of fighterRequirements.find({})) {
    const config = configMap.get(requirement.eventRequirementId.toString());
    const fighter = fighterMap.get(requirement.fighterId.toString());
    const sentDeadlineAt = deadlineAlertMap.get(
      `${requirement.fighterId}:${requirement.eventRequirementId}`,
    );
    const schedule = buildSchedule({
      requirement,
      config,
      hasRecipient: Boolean(fighter?.managerEmail && fighter.managerName),
      sentDeadlineAt,
      now,
    });

    operations.push({
      updateOne: {
        filter: { _id: requirement._id },
        update: {
          $set: {
            ...schedule,
            reminderLockedUntil: null,
            reminderClaimToken: null,
            reminderAttemptCount: 0,
            deadlineAlertAttemptCount: 0,
          },
        },
      },
    });

    if (operations.length === 500) {
      await fighterRequirements.bulkWrite(operations, { ordered: false });
      migratedCount += operations.length;
      operations.length = 0;
    }
  }

  if (operations.length > 0) {
    await fighterRequirements.bulkWrite(operations, { ordered: false });
    migratedCount += operations.length;
  }

  let removedLegacyLogs = 0;
  if (cleanupLegacyQueue) {
    const cleanup = await reminderLogs.deleteMany({
      status: { $in: ["PENDING", "SKIPPED"] },
    });
    removedLegacyLogs = cleanup.deletedCount ?? 0;
  }

  console.log(`Migrated ${migratedCount} fighter requirement reminder schedules.`);
  console.log(
    cleanupLegacyQueue
      ? `Removed ${removedLegacyLogs} legacy pending/skipped queue records.`
      : "Legacy pending/skipped records were preserved. Pass --cleanup-legacy-queue to remove them.",
  );
} finally {
  await mongoose.disconnect();
}

function buildSchedule({ requirement, config, hasRecipient, sentDeadlineAt, now }) {
  const isActionable = ["WAITING", "NEEDS_RESUBMISSION"].includes(requirement.status);
  const dueDate = requirement.dueDate ? new Date(requirement.dueDate) : null;

  if (!isActionable || !dueDate || !config) {
    return {
      nextReminderAt: null,
      nextDeadlineAlertAt: null,
      deadlineAlertSentAt: sentDeadlineAt ?? null,
      reminderStoppedReason: !isActionable
        ? `status_${String(requirement.status).toLowerCase()}`
        : !dueDate
          ? "waiting_for_due_date"
          : "missing_event_requirement",
    };
  }

  const nextDeadlineAlertAt = sentDeadlineAt ? null : endOfUtcDay(dueDate);

  if (!config.reminderEnabled || config.reminderCadence === "off" || !hasRecipient) {
    return {
      nextReminderAt: null,
      nextDeadlineAlertAt,
      deadlineAlertSentAt: sentDeadlineAt ?? null,
      reminderStoppedReason: hasRecipient ? "reminders_disabled" : "missing_recipient",
    };
  }

  return {
    nextReminderAt: calculateNextReminder(config, dueDate, now),
    nextDeadlineAlertAt,
    deadlineAlertSentAt: sentDeadlineAt ?? null,
    reminderStoppedReason: null,
  };
}

function calculateNextReminder(config, dueDate, now) {
  if (config.reminderCadence === "once_before_due") {
    return [...new Set(config.reminderDaysBeforeDue ?? [])]
      .map((days) => addDays(startOfUtcDay(dueDate), -days))
      .filter((date) => date >= now)
      .sort((left, right) => left - right)[0] ?? null;
  }

  const startDate = addDays(
    startOfUtcDay(dueDate),
    -(config.reminderDaysBeforeDue?.[0] ?? 0),
  );
  return startDate > now ? startDate : now;
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
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
