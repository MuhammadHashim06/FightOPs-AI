import { fighterRequirementsRepository } from "@/server/repositories/fighter-requirements.repository";
import { eventRequirementsRepository } from "@/server/repositories/event-requirements.repository";
import { fightersRepository } from "@/server/repositories/fighters.repository";
import { getFightsByEventId } from "@/server/repositories/fights.repository";
import { reminderLogsRepository } from "@/server/repositories/reminder-logs.repository";
import { sendOperationalReminderEmail } from "@/server/services/email.service";
import { getEventById } from "@/server/services/events.service";
import type { FighterRequirementStatus, ReminderLogRecord } from "@/types/readiness";

const fighterActionStatuses = new Set<FighterRequirementStatus>([
  "WAITING",
  "NEEDS_RESUBMISSION",
]);

export async function syncEventReminderQueue(eventId: string) {
  const event = await getEventById(eventId);

  if (!event) {
    throw new Error("Event was not found.");
  }

  const [fighterRequirements, eventRequirements, fighters, fights] = await Promise.all([
    fighterRequirementsRepository.listByEventId(eventId),
    eventRequirementsRepository.listByEventId(eventId),
    fightersRepository.listFightersByEventId(eventId),
    getFightsByEventId(eventId),
  ]);

  const eventRequirementMap = new Map(
    eventRequirements.map((requirement) => [requirement.id, requirement]),
  );
  const fighterMap = new Map(fighters.map((fighter) => [fighter.id, fighter]));
  const fightMap = new Map(fights.map((fight) => [fight.id, fight]));

  const createdLogs: ReminderLogRecord[] = [];

  for (const requirement of fighterRequirements) {
    if (!fighterActionStatuses.has(requirement.status)) {
      continue;
    }

    if (!requirement.dueDate) {
      continue;
    }

    const fighter = fighterMap.get(requirement.fighterId);

    if (!fighter?.managerEmail || !fighter.managerName) {
      continue;
    }

    const eventRequirement = eventRequirementMap.get(requirement.eventRequirementId);

    if (!eventRequirement?.reminderEnabled || eventRequirement.reminderCadence === "off") {
      continue;
    }

    for (const scheduledFor of calculateReminderSchedule({
      dueDateIso: requirement.dueDate,
      cadence: eventRequirement.reminderCadence,
      reminderDaysBeforeDue: eventRequirement.reminderDaysBeforeDue,
    })) {
      const fight = requirement.fightId ? fightMap.get(requirement.fightId) : null;

      const log = await reminderLogsRepository.upsertReminder({
        eventId,
        fighterId: requirement.fighterId,
        fightId: requirement.fightId,
        eventRequirementId: requirement.eventRequirementId,
        recipientName: fighter.managerName,
        recipientEmail: fighter.managerEmail,
        requirementName: eventRequirement.name,
        eventName: event.name,
        scheduledFor: scheduledFor.toISOString(),
        dueDate: requirement.dueDate,
        subject:
          eventRequirement.reminderSubject ??
          buildReminderSubject(event.name, eventRequirement.name),
        message:
          eventRequirement.reminderMessage ??
          buildReminderMessage({
            recipientName: fighter.managerName,
            fighterName: fighter.fullName,
            eventName: event.name,
            requirementName: eventRequirement.name,
            dueDate: requirement.dueDate,
            division: fight?.division ?? fighter.division ?? "TBD",
          }),
      });

      createdLogs.push(log);
    }
  }

  return createdLogs;
}

export async function listEventReminders(eventId: string) {
  await syncEventReminderQueue(eventId);
  const reminders = await reminderLogsRepository.listByEventId(eventId);

  const total = reminders.length;
  const pending = reminders.filter((item) => item.status === "PENDING").length;
  const sent = reminders.filter((item) => item.status === "SENT").length;
  const overdue = reminders.filter(
    (item) => item.status === "PENDING" && new Date(item.scheduledFor) <= new Date(),
  ).length;

  return {
    reminders,
    summary: {
      total,
      pending,
      sent,
      overdue,
    },
  };
}

export async function sendDueReminders(eventId: string) {
  const { reminders } = await listEventReminders(eventId);
  const fighterRequirements = await fighterRequirementsRepository.listByEventId(eventId);
  const actionableRequirementKeys = new Set(
    fighterRequirements
      .filter((requirement) => fighterActionStatuses.has(requirement.status))
      .map((requirement) =>
        buildReminderRequirementKey(
          requirement.fighterId,
          requirement.eventRequirementId,
        ),
      ),
  );
  const dueReminders = reminders.filter(
    (item) =>
      item.status === "PENDING" &&
      new Date(item.scheduledFor) <= new Date() &&
      actionableRequirementKeys.has(
        buildReminderRequirementKey(item.fighterId, item.eventRequirementId),
      ),
  );

  let sentCount = 0;
  let failedCount = 0;

  for (const reminder of dueReminders) {
    try {
      await sendOperationalReminderEmail({
        email: reminder.recipientEmail,
        recipientName: reminder.recipientName,
        subject: reminder.subject,
        message: reminder.message,
        eventName: reminder.eventName,
        requirementName: reminder.requirementName,
        dueDate: reminder.dueDate,
      });

      await reminderLogsRepository.updateStatus(reminder.id, "SENT");
      sentCount += 1;
    } catch {
      await reminderLogsRepository.updateStatus(reminder.id, "FAILED");
      failedCount += 1;
    }
  }

  return {
    sentCount,
    failedCount,
  };
}

function calculateReminderSchedule(params: {
  dueDateIso: string;
  cadence: "daily_until_resolved" | "once_before_due" | "off";
  reminderDaysBeforeDue: number[];
}) {
  if (params.cadence === "off") {
    return [];
  }

  if (params.cadence === "once_before_due") {
    const today = startOfUtcDay(new Date());

    return params.reminderDaysBeforeDue
      .map((daysBeforeDue) => startOfUtcDay(addDays(params.dueDateIso, -daysBeforeDue)))
      .filter((date) => date.getTime() >= today.getTime());
  }

  const dueDate = startOfUtcDay(new Date(params.dueDateIso));
  const today = startOfUtcDay(new Date());
  const configuredStartDate = startOfUtcDay(
    addDays(
      params.dueDateIso,
      -(params.reminderDaysBeforeDue[0] ?? 0),
    ),
  );
  const firstReminderDate =
    configuredStartDate.getTime() > today.getTime() ? configuredStartDate : today;
  const schedule: Date[] = [];

  for (
    const date = firstReminderDate;
    date.getTime() <= dueDate.getTime();
    date.setUTCDate(date.getUTCDate() + 1)
  ) {
    schedule.push(new Date(date));
  }

  return schedule;
}

function addDays(dateIso: string, days: number) {
  const date = new Date(dateIso);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function buildReminderSubject(eventName: string, requirementName: string) {
  return `${eventName}: ${requirementName} reminder`;
}

function buildReminderRequirementKey(fighterId: string, eventRequirementId: string) {
  return `${fighterId}:${eventRequirementId}`;
}

function buildReminderMessage(params: {
  recipientName: string;
  fighterName: string;
  eventName: string;
  requirementName: string;
  dueDate: string;
  division: string;
}) {
  return `Hello ${params.recipientName}, please submit ${params.requirementName} for ${params.fighterName} (${params.division}) before ${params.dueDate.slice(0, 10)} for ${params.eventName}.`;
}
