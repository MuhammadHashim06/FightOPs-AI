import { fighterRequirementsRepository } from "@/server/repositories/fighter-requirements.repository";
import { eventRequirementsRepository } from "@/server/repositories/event-requirements.repository";
import { fightersRepository } from "@/server/repositories/fighters.repository";
import { getFightsByEventId } from "@/server/repositories/fights.repository";
import { reminderLogsRepository } from "@/server/repositories/reminder-logs.repository";
import { sendOperationalReminderEmail } from "@/server/services/email.service";
import { getEventById } from "@/server/services/events.service";
import type { FighterRequirementStatus, ReminderLogRecord } from "@/types/readiness";

const pendingStatuses = new Set<FighterRequirementStatus>([
  "WAITING",
  "PROCESSING",
  "RECEIVED",
  "NEEDS_RESUBMISSION",
  "HUMAN_ACTION",
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
    if (!pendingStatuses.has(requirement.status)) {
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

    if (!eventRequirement?.reminderEnabled) {
      continue;
    }

    for (const reminderDays of eventRequirement.reminderDaysBeforeDue) {
      const scheduledFor = calculateScheduledFor(requirement.dueDate, reminderDays);
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
        scheduledFor,
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
  const dueReminders = reminders.filter(
    (item) => item.status === "PENDING" && new Date(item.scheduledFor) <= new Date(),
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

function calculateScheduledFor(dueDateIso: string, reminderDaysBeforeDue: number) {
  const date = new Date(dueDateIso);
  date.setUTCDate(date.getUTCDate() - reminderDaysBeforeDue);
  return date.toISOString();
}

function buildReminderSubject(eventName: string, requirementName: string) {
  return `${eventName}: ${requirementName} reminder`;
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
