import { authRepository } from "@/server/repositories/auth.repository";
import { eventRequirementsRepository } from "@/server/repositories/event-requirements.repository";
import { eventsRepository } from "@/server/repositories/events.repository";
import { fighterRequirementsRepository } from "@/server/repositories/fighter-requirements.repository";
import { fightersRepository } from "@/server/repositories/fighters.repository";
import { reminderLogsRepository } from "@/server/repositories/reminder-logs.repository";
import { auditLogsRepository } from "@/server/repositories/audit-logs.repository";
import { sendOperationalReminderEmail } from "@/server/services/email.service";
import { env } from "@/server/config/env";
import type {
  EventRequirementRecord,
  FighterRequirementRecord,
  FighterRequirementStatus,
} from "@/types/readiness";

const actionableStatuses = new Set<FighterRequirementStatus>([
  "WAITING",
  "NEEDS_RESUBMISSION",
]);
const reminderBatchSize = 50;
const reminderLockMinutes = 5;
const maxDeliveryAttempts = 4;
const workerConcurrency = 5;

type ReminderDeliveryInput = Parameters<
  typeof reminderLogsRepository.recordDeliveries
>[0][number];
type ReminderCompletion = Parameters<
  typeof fighterRequirementsRepository.completeReminderBatch
>[0][number];

export async function refreshRequirementReminderSchedule(
  fighterRequirementId: string,
) {
  const requirements = await fighterRequirementsRepository.listByIds([
    fighterRequirementId,
  ]);
  return refreshReminderSchedules(requirements);
}

export async function refreshFighterReminderSchedules(
  eventId: string,
  fighterId: string,
) {
  const requirements = await fighterRequirementsRepository.listByEventAndFighter(
    eventId,
    fighterId,
  );
  return refreshReminderSchedules(requirements);
}

export async function refreshEventRequirementReminderSchedules(
  eventId: string,
  eventRequirementId: string,
) {
  const requirements = await fighterRequirementsRepository.listByEventRequirementId(
    eventId,
    eventRequirementId,
  );
  return refreshReminderSchedules(requirements);
}

export async function listEventReminders(eventId: string) {
  const [allLogs, requirements] = await Promise.all([
    reminderLogsRepository.listByEventId(eventId),
    fighterRequirementsRepository.listByEventId(eventId),
  ]);
  const reminders = allLogs.filter(
    (item) => item.status === "SENT" || item.status === "FAILED",
  );
  const now = Date.now();
  const activeRequirements = requirements.filter((requirement) =>
    actionableStatuses.has(requirement.status),
  );

  return {
    reminders,
    summary: {
      total: reminders.length,
      pending: activeRequirements.filter((item) => item.nextReminderAt).length,
      sent: reminders.filter((item) => item.status === "SENT").length,
      overdue: activeRequirements.filter(
        (item) => item.dueDate && new Date(item.dueDate).getTime() <= now,
      ).length,
    },
  };
}

export async function sendDueReminders(eventId: string) {
  return drainDueReminderWork(eventId);
}

export async function sendDueRemindersForAllEvents() {
  return drainDueReminderWork();
}

async function refreshReminderSchedules(requirements: FighterRequirementRecord[]) {
  if (requirements.length === 0) {
    return 0;
  }

  const [eventRequirements, fighters] = await Promise.all([
    eventRequirementsRepository.listByIds(
      unique(requirements.map((item) => item.eventRequirementId)),
    ),
    fightersRepository.listFightersByIds(
      unique(requirements.map((item) => item.fighterId)),
    ),
  ]);
  const eventRequirementMap = new Map(
    eventRequirements.map((requirement) => [requirement.id, requirement]),
  );
  const fighterMap = new Map(fighters.map((fighter) => [fighter.id, fighter]));
  const now = new Date();

  return fighterRequirementsRepository.updateReminderSchedules(
    requirements.map((requirement) => {
      const eventRequirement = eventRequirementMap.get(
        requirement.eventRequirementId,
      );
      const fighter = fighterMap.get(requirement.fighterId);
      const schedule = buildRequirementSchedule({
        requirement,
        eventRequirement,
        hasRecipient: Boolean(fighter?.managerEmail && fighter.managerName),
        now,
      });

      return {
        fighterRequirementId: requirement.id,
        ...schedule,
        resetDeliveryState: true,
      };
    }),
  );
}

async function drainDueReminderWork(eventId?: string) {
  let sentCount = 0;
  let failedCount = 0;
  let processedCount = 0;
  const processedEventIds = new Set<string>();

  for (let batchNumber = 0; batchNumber < 20; batchNumber += 1) {
    const batch = await processDueReminderBatch(eventId);
    sentCount += batch.sentCount;
    failedCount += batch.failedCount;
    processedCount += batch.processedCount;
    batch.eventIds.forEach((id) => processedEventIds.add(id));

    if (batch.processedCount < reminderBatchSize) {
      break;
    }
  }

  return {
    eventsProcessed: processedEventIds.size,
    processedCount,
    sentCount,
    failedCount,
  };
}

async function processDueReminderBatch(eventId?: string) {
  const now = new Date();
  const claim = await fighterRequirementsRepository.claimDueReminderBatch({
    now: now.toISOString(),
    lockedUntil: addMinutes(now, reminderLockMinutes).toISOString(),
    limit: reminderBatchSize,
    eventId,
  });

  if (!claim.claimToken || claim.requirements.length === 0) {
    return emptyBatchResult();
  }

  const [eventRequirements, fighters, events] = await Promise.all([
    eventRequirementsRepository.listByIds(
      unique(claim.requirements.map((item) => item.eventRequirementId)),
    ),
    fightersRepository.listFightersByIds(
      unique(claim.requirements.map((item) => item.fighterId)),
    ),
    eventsRepository.listEventsByIds(
      unique(claim.requirements.map((item) => item.eventId)),
    ),
  ]);
  const eventRequirementMap = new Map(
    eventRequirements.map((requirement) => [requirement.id, requirement]),
  );
  const fighterMap = new Map(fighters.map((fighter) => [fighter.id, fighter]));
  const eventMap = new Map(events.map((event) => [event.id, event]));
  const ownerEntries = await Promise.all(
    unique(events.map((event) => event.createdByUserId)).map(async (ownerId) => [
      ownerId,
      await authRepository.findUserById(ownerId),
    ] as const),
  );
  const ownerMap = new Map(ownerEntries);

  const processed = await mapWithConcurrency(
    claim.requirements,
    workerConcurrency,
    async (requirement) =>
      processClaimedRequirement({
        requirement,
        claimToken: claim.claimToken as string,
        eventRequirement: eventRequirementMap.get(requirement.eventRequirementId),
        fighter: fighterMap.get(requirement.fighterId),
        event: eventMap.get(requirement.eventId),
        ownerMap,
        now,
      }),
  );
  const completions = processed.map((item) => item.completion);
  const deliveries = processed.flatMap((item) => item.deliveries);

  await fighterRequirementsRepository.completeReminderBatch(completions);
  await reminderLogsRepository.recordDeliveries(deliveries);
  await Promise.all(
    deliveries.map((delivery) => {
      const event = eventMap.get(delivery.eventId);
      return event
        ? auditLogsRepository.create({
            eventId: delivery.eventId,
            fighterId: delivery.fighterId,
            fightId: delivery.fightId,
            requirementId: delivery.eventRequirementId,
            actorUserId: event.createdByUserId,
            action: delivery.status === "SENT" ? "reminder_sent" : "reminder_failed",
            stateFrom: "SCHEDULED",
            stateTo: delivery.status,
            note: delivery.subject,
          })
        : Promise.resolve(null);
    }),
  );

  return {
    processedCount: processed.length,
    sentCount: processed.reduce((sum, item) => sum + item.sentCount, 0),
    failedCount: processed.reduce((sum, item) => sum + item.failedCount, 0),
    eventIds: unique(claim.requirements.map((item) => item.eventId)),
  };
}

async function processClaimedRequirement(params: {
  requirement: FighterRequirementRecord;
  claimToken: string;
  eventRequirement?: EventRequirementRecord;
  fighter?: Awaited<ReturnType<typeof fightersRepository.listFightersByIds>>[number];
  event?: Awaited<ReturnType<typeof eventsRepository.listEventsByIds>>[number];
  ownerMap: Map<string, Awaited<ReturnType<typeof authRepository.findUserById>>>;
  now: Date;
}) {
  const { requirement, eventRequirement, fighter, event, now } = params;
  const completion: ReminderCompletion = {
    fighterRequirementId: requirement.id,
    claimToken: params.claimToken,
    nextReminderAt: requirement.nextReminderAt,
    reminderAttemptCount: requirement.reminderAttemptCount,
    nextDeadlineAlertAt: requirement.nextDeadlineAlertAt,
    deadlineAlertAttemptCount: requirement.deadlineAlertAttemptCount,
  };
  const deliveries: ReminderDeliveryInput[] = [];
  let sentCount = 0;
  let failedCount = 0;

  if (!eventRequirement || !event || !fighter) {
    completion.nextReminderAt = null;
    completion.nextDeadlineAlertAt = null;
    completion.reminderStoppedReason = "missing_schedule_context";
    return { completion, deliveries, sentCount, failedCount };
  }

  if (isDue(requirement.nextReminderAt, now)) {
    if (!fighter.managerEmail) {
      completion.nextReminderAt = null;
      completion.reminderStoppedReason = "missing_recipient";
    } else {
      const result = await deliverFighterReminder({
        requirement,
        eventRequirement,
        fighter,
        event,
        now,
      });
      deliveries.push(result.delivery);
      sentCount += result.sent ? 1 : 0;
      failedCount += result.sent ? 0 : 1;

      if (result.sent) {
        completion.lastReminderAt = now.toISOString();
        completion.reminderAttemptCount = 0;
        completion.nextReminderAt =
          eventRequirement.reminderCadence === "daily_until_resolved"
            ? startOfNextUtcDay(now).toISOString()
            : null;
        completion.reminderStoppedReason = completion.nextReminderAt
          ? null
          : "reminder_completed";
      } else {
        const attemptCount = requirement.reminderAttemptCount + 1;
        completion.reminderAttemptCount = attemptCount;
        completion.nextReminderAt =
          getRetryDate(now, attemptCount)?.toISOString() ?? null;
        completion.reminderStoppedReason = completion.nextReminderAt
          ? null
          : "reminder_delivery_failed";
      }
    }
  }

  if (isDue(requirement.nextDeadlineAlertAt, now)) {
    const owner = params.ownerMap.get(event.createdByUserId) ?? null;
    const result = await deliverDeadlineAlert({
      requirement,
      eventRequirement,
      fighter,
      event,
      owner,
      now,
    });

    if (result.delivery) {
      deliveries.push(result.delivery);
      sentCount += result.sent ? 1 : 0;
      failedCount += result.sent ? 0 : 1;
    }

    if (result.sent) {
      completion.deadlineAlertSentAt = now.toISOString();
      completion.deadlineAlertAttemptCount = 0;
      completion.nextDeadlineAlertAt = null;
    } else if (result.delivery) {
      const attemptCount = requirement.deadlineAlertAttemptCount + 1;
      completion.deadlineAlertAttemptCount = attemptCount;
      completion.nextDeadlineAlertAt =
        getRetryDate(now, attemptCount)?.toISOString() ?? null;
    } else {
      completion.nextDeadlineAlertAt = null;
      completion.reminderStoppedReason = "missing_event_owner";
    }
  }

  return { completion, deliveries, sentCount, failedCount };
}

async function deliverFighterReminder(params: {
  requirement: FighterRequirementRecord;
  eventRequirement: EventRequirementRecord;
  fighter: Awaited<ReturnType<typeof fightersRepository.listFightersByIds>>[number];
  event: Awaited<ReturnType<typeof eventsRepository.listEventsByIds>>[number];
  now: Date;
}) {
  const daysRemaining = formatDaysRemaining(params.requirement.dueDate, params.now);
  const subject =
    params.eventRequirement.reminderSubject ??
    "{{eventName}}: {{requirementName}} reminder";
  const message =
    params.eventRequirement.reminderMessage ??
    "Please submit {{requirementName}} for {{fighterName}} before {{dueDate}}. You have {{daysRemaining}} day(s) remaining.";
  const delivery = buildDelivery({
    requirement: params.requirement,
    eventRequirement: params.eventRequirement,
    event: params.event,
    recipientName: params.fighter.managerName ?? params.fighter.fullName,
    recipientEmail: params.fighter.managerEmail ?? "",
    kind: "fighter_reminder",
    subject,
    message,
    attemptedAt: params.now,
    attemptCount: params.requirement.reminderAttemptCount + 1,
  });

  try {
    await sendOperationalReminderEmail({
      email: delivery.recipientEmail,
      recipientName: delivery.recipientName,
      subject,
      message,
      eventName: params.event.name,
      requirementName: params.eventRequirement.name,
      dueDate: params.requirement.dueDate,
      fighterName: params.fighter.fullName,
      eventDate: formatEventDate(params.event.date),
      eventLocation: params.event.location,
      daysRemaining,
      uploadLink: `${env.appUrl}/dashboard/fighter/documents`,
    });
    return { sent: true, delivery: { ...delivery, status: "SENT" as const } };
  } catch (error) {
    return {
      sent: false,
      delivery: {
        ...delivery,
        status: "FAILED" as const,
        errorMessage: getErrorMessage(error),
      },
    };
  }
}

async function deliverDeadlineAlert(params: {
  requirement: FighterRequirementRecord;
  eventRequirement: EventRequirementRecord;
  fighter: Awaited<ReturnType<typeof fightersRepository.listFightersByIds>>[number];
  event: Awaited<ReturnType<typeof eventsRepository.listEventsByIds>>[number];
  owner: Awaited<ReturnType<typeof authRepository.findUserById>>;
  now: Date;
}) {
  if (!params.owner?.email) {
    return { sent: false, delivery: null };
  }

  const subject = "{{eventName}}: {{requirementName}} deadline passed";
  const message = "{{requirementName}} for {{fighterName}} is still unresolved and passed its deadline. Review the requirement and take action.";
  const delivery = buildDelivery({
    requirement: params.requirement,
    eventRequirement: params.eventRequirement,
    event: params.event,
    recipientName: params.owner.profile.displayName,
    recipientEmail: params.owner.email,
    kind: "deadline_alert",
    subject,
    message,
    attemptedAt: params.now,
    attemptCount: params.requirement.deadlineAlertAttemptCount + 1,
  });

  try {
    await sendOperationalReminderEmail({
      email: delivery.recipientEmail,
      recipientName: delivery.recipientName,
      subject,
      message,
      eventName: params.event.name,
      requirementName: params.eventRequirement.name,
      dueDate: params.requirement.dueDate,
      fighterName: params.fighter.fullName,
      eventDate: formatEventDate(params.event.date),
      eventLocation: params.event.location,
      daysRemaining: formatDaysRemaining(params.requirement.dueDate, params.now),
      uploadLink: `${env.appUrl}/dashboard/promoter/human-action`,
    });
    return { sent: true, delivery: { ...delivery, status: "SENT" as const } };
  } catch (error) {
    return {
      sent: false,
      delivery: {
        ...delivery,
        status: "FAILED" as const,
        errorMessage: getErrorMessage(error),
      },
    };
  }
}

function buildDelivery(params: {
  requirement: FighterRequirementRecord;
  eventRequirement: EventRequirementRecord;
  event: Awaited<ReturnType<typeof eventsRepository.listEventsByIds>>[number];
  recipientName: string;
  recipientEmail: string;
  kind: "fighter_reminder" | "deadline_alert";
  subject: string;
  message: string;
  attemptedAt: Date;
  attemptCount: number;
}) {
  const scheduledFor =
    params.kind === "deadline_alert"
      ? params.requirement.nextDeadlineAlertAt
      : params.requirement.nextReminderAt;

  return {
    eventId: params.requirement.eventId,
    fighterId: params.requirement.fighterId,
    fightId: params.requirement.fightId,
    eventRequirementId: params.requirement.eventRequirementId,
    kind: params.kind,
    recipientName: params.recipientName,
    recipientEmail: params.recipientEmail,
    requirementName: params.eventRequirement.name,
    eventName: params.event.name,
    scheduledFor: scheduledFor ?? params.attemptedAt.toISOString(),
    dueDate: params.requirement.dueDate,
    subject: params.subject,
    message: params.message,
    attemptedAt: params.attemptedAt.toISOString(),
    attemptCount: params.attemptCount,
  };
}

function buildRequirementSchedule(params: {
  requirement: FighterRequirementRecord;
  eventRequirement?: EventRequirementRecord;
  hasRecipient: boolean;
  now: Date;
}) {
  const { requirement, eventRequirement, now } = params;

  if (!actionableStatuses.has(requirement.status)) {
    return stoppedSchedule(`status_${requirement.status.toLowerCase()}`);
  }

  if (!eventRequirement) {
    return stoppedSchedule("missing_event_requirement");
  }

  if (!requirement.dueDate) {
    return stoppedSchedule("waiting_for_due_date");
  }

  const nextDeadlineAlertAt = requirement.deadlineAlertSentAt
    ? null
    : endOfUtcDay(new Date(requirement.dueDate)).toISOString();

  if (!eventRequirement.reminderEnabled || eventRequirement.reminderCadence === "off") {
    return {
      nextReminderAt: null,
      nextDeadlineAlertAt,
      reminderStoppedReason: "reminders_disabled",
    };
  }

  if (!params.hasRecipient) {
    return {
      nextReminderAt: null,
      nextDeadlineAlertAt,
      reminderStoppedReason: "missing_recipient",
    };
  }

  const nextReminderAt = calculateInitialReminderAt({
    dueDateIso: requirement.dueDate,
    cadence: eventRequirement.reminderCadence,
    reminderDaysBeforeDue: eventRequirement.reminderDaysBeforeDue,
    now,
  });

  return {
    nextReminderAt,
    nextDeadlineAlertAt,
    reminderStoppedReason: nextReminderAt ? null : "reminder_window_passed",
  };
}

function calculateInitialReminderAt(params: {
  dueDateIso: string;
  cadence: EventRequirementRecord["reminderCadence"];
  reminderDaysBeforeDue: number[];
  now: Date;
}) {
  if (params.cadence === "off") {
    return null;
  }

  const dueDate = startOfUtcDay(new Date(params.dueDateIso));

  if (params.cadence === "once_before_due") {
    const candidates = unique(params.reminderDaysBeforeDue)
      .map((days) => addDays(dueDate, -days))
      .filter((date) => date.getTime() >= params.now.getTime())
      .sort((left, right) => left.getTime() - right.getTime());
    return candidates[0]?.toISOString() ?? null;
  }

  const startDate = addDays(
    dueDate,
    -(params.reminderDaysBeforeDue[0] ?? 0),
  );
  return (startDate.getTime() > params.now.getTime() ? startDate : params.now).toISOString();
}

function stoppedSchedule(reason: string) {
  return {
    nextReminderAt: null,
    nextDeadlineAlertAt: null,
    reminderStoppedReason: reason,
  };
}

function getRetryDate(now: Date, attemptCount: number) {
  if (attemptCount >= maxDeliveryAttempts) {
    return null;
  }

  const retryMinutes = [5, 30, 120][Math.max(0, attemptCount - 1)] ?? 120;
  return addMinutes(now, retryMinutes);
}

function isDue(value: string | null, now: Date) {
  return Boolean(value && new Date(value).getTime() <= now.getTime());
}

function formatEventDate(value: string) {
  return value.slice(0, 10);
}

function formatDaysRemaining(value: string | null, now: Date) {
  if (!value) return "Not set";

  const dueDate = startOfUtcDay(new Date(value));
  const today = startOfUtcDay(now);
  const days = Math.ceil((dueDate.getTime() - today.getTime()) / 86_400_000);
  return days < 0 ? "Overdue" : String(days);
}

function startOfNextUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1),
  );
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date: Date) {
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

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Email delivery failed.";
}

function emptyBatchResult() {
  return {
    processedCount: 0,
    sentCount: 0,
    failedCount: 0,
    eventIds: [] as string[],
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
) {
  const results: R[] = [];

  for (let index = 0; index < items.length; index += concurrency) {
    results.push(...(await Promise.all(items.slice(index, index + concurrency).map(mapper))));
  }

  return results;
}
