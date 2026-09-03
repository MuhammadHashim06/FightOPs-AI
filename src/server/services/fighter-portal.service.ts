import { eventRequirementsRepository } from "@/server/repositories/event-requirements.repository";
import { documentSubmissionsRepository } from "@/server/repositories/document-submissions.repository";
import { eventsRepository } from "@/server/repositories/events.repository";
import { fighterReadinessRepository } from "@/server/repositories/fighter-readiness.repository";
import { fighterRequirementsRepository } from "@/server/repositories/fighter-requirements.repository";
import { fightersRepository } from "@/server/repositories/fighters.repository";
import { getFightById, getFightsByFighterId } from "@/server/repositories/fights.repository";
import { reminderLogsRepository } from "@/server/repositories/reminder-logs.repository";
import { listEventReminders } from "@/server/services/reminders.service";
import { calculateReadinessPercentage } from "@/server/services/readiness.service";
import type { AuthUser } from "@/types/auth";
import type { FightRecord, FighterRecord } from "@/types/event";
import type {
  EventRequirementRecord,
  FighterRequirementRecord,
  FighterRequirementStatus,
  ReadinessStatus,
} from "@/types/readiness";

export type FighterDashboardData = {
  fighterName: string;
  documentSummary: string;
  notificationSummary: string;
  supportSummary: string;
  upcomingFight: {
    id: string;
    eventName: string;
    date: string;
    venue: string;
    opponent: string;
    weightClass: string;
    statusLabel: string;
  } | null;
  readiness: {
    percentage: number;
    statusLabel: string;
    required: number;
    verified: number;
    pending: number;
    rejected: number;
  };
};

export type FighterFightListItem = {
  id: string;
  eventName: string;
  date: string;
  opponent: string;
  venue: string;
  weight: string;
  position: string;
  status: string;
  statusClassName: string;
  group: "upcoming" | "completed";
};

export type FighterFightDetailData = {
  id: string;
  eventName: string;
  titleLabel: string;
  date: string;
  venue: string;
  location: string;
  time: string;
  opponent: string;
  weight: string;
  fightType: string;
  position: string;
  promotionContact: string;
  operationsEmail: string;
  heroStatusLabel: string;
  heroStatusClassName: string;
  contractName: string;
  contractVersion: string;
  contractRequirementId: string | null;
  contractStage: "awaiting_signature" | "under_review" | "confirmed";
  nextSteps: Array<{
    id: string;
    title: string;
    description: string;
    locked: boolean;
  }>;
  requirementCounts: {
    required: number;
    verified: number;
    pending: number;
    rejected: number;
  };
  fightOverview: {
    readinessPercentage: number;
    readinessStatusLabel: string;
    nextAction: string;
    submittedDocuments: number;
    remainingDocuments: number;
    remindersSent: number;
  };
  fighterOverview: {
    fighterName: string;
    managerName: string;
    contactEmail: string;
    contactPhone: string;
    nationality: string;
    stance: string;
    inviteStatus: string;
  };
  submittedDocuments: Array<{
    id: string;
    title: string;
    statusLabel: string;
    detail: string;
    fileName: string | null;
  }>;
  remainingDocuments: Array<{
    id: string;
    title: string;
    priorityLabel: string;
    dueLabel: string;
    statusLabel: string;
  }>;
  reminderHistory: Array<{
    id: string;
    requirementName: string;
    statusLabel: string;
    scheduledForLabel: string;
    sentAtLabel: string;
  }>;
};

export type FighterDocumentsPageData = {
  fighterName: string;
  requirements: Array<{
    id: string;
    eventId: string;
    eventName: string;
    fightId: string | null;
    title: string;
    category: string;
    status: FighterRequirementStatus;
    statusLabel: string;
    dueLabel: string;
    acceptedFileTypes: string[];
    submissionId: string | null;
    fileName: string | null;
    publicUrl: string | null;
    reviewNote: string | null;
  }>;
};

export type FighterNotificationsPageData = {
  fighterName: string;
  notifications: Array<{
    id: string;
    eventName: string;
    requirementName: string;
    status: "PENDING" | "SENT" | "SKIPPED" | "FAILED";
    statusLabel: string;
    scheduledForLabel: string;
    sentAtLabel: string;
    dueDateLabel: string;
    message: string;
  }>;
};

export type FighterHumanActionPageData = {
  fighterName: string;
  cases: Array<{
    id: string;
    eventName: string;
    fightId: string;
    requirementName: string;
    status: "HUMAN_ACTION" | "NEEDS_RESUBMISSION";
    statusLabel: string;
    reason: string;
    dueLabel: string;
  }>;
};

type FightContext = {
  fight: FightRecord;
  event: NonNullable<Awaited<ReturnType<typeof eventsRepository.findEventById>>>;
  fighter: FighterRecord;
  opponent: FighterRecord | null;
  readiness: Awaited<ReturnType<typeof fighterReadinessRepository.findByEventAndFighter>>;
  requirements: FighterRequirementRecord[];
};

export async function getFighterDashboardDataForUser(
  user: Pick<AuthUser, "id" | "email" | "profile">,
): Promise<FighterDashboardData | null> {
  const fighters = await fightersRepository.listFightersByAccount({
    userId: user.id,
    email: user.email,
  });

  if (fighters.length === 0) {
    return null;
  }

  const fights = await listUniqueFightsForFighters(fighters);
  const primaryFighter = pickPrimaryFighter(fighters, user.profile.displayName);

  if (fights.length === 0) {
    return {
      fighterName:
        primaryFighter?.fullName ?? user.profile.displayName ?? "Fighter",
      documentSummary: "0 of 0 verified",
      notificationSummary: "0 unread messages",
      supportSummary: "Operations team",
      upcomingFight: null,
      readiness: {
        percentage: 0,
        statusLabel: "Pending",
        required: 0,
        verified: 0,
        pending: 0,
        rejected: 0,
      },
    };
  }

  const contexts = await buildFightContexts(fighters, fights);
  const upcomingFight =
    contexts.find((item) => classifyFightGroup(item.event.date, item.event.status) === "upcoming") ??
    contexts[0] ??
    null;

  const requirementSummary = upcomingFight
    ? summarizeRequirementStatuses(upcomingFight.requirements)
    : emptyRequirementSummary();
  const readinessStatus = upcomingFight?.readiness?.status ?? "WAITING";

  return {
    fighterName:
      primaryFighter?.fullName ?? user.profile.displayName ?? "Fighter",
    documentSummary: `${requirementSummary.verified} of ${requirementSummary.required} verified`,
    notificationSummary: `${requirementSummary.pending + requirementSummary.rejected} unread messages`,
    supportSummary: "Operations team",
    upcomingFight: upcomingFight
      ? {
          id: upcomingFight.fight.id,
          eventName: upcomingFight.event.name,
          date: formatDisplayDate(upcomingFight.event.date),
          venue: upcomingFight.event.location,
          opponent: upcomingFight.opponent?.fullName ?? "TBD Opponent",
          weightClass: upcomingFight.fight.division,
          statusLabel: mapReadinessStatusLabel(readinessStatus),
        }
      : null,
    readiness: {
      percentage: upcomingFight
        ? calculateReadinessPercentage(upcomingFight.requirements)
        : 0,
      statusLabel: mapReadinessStatusLabel(readinessStatus),
      ...requirementSummary,
    },
  };
}

export async function listFighterFightCardsForUser(
  user: Pick<AuthUser, "id" | "email">,
): Promise<FighterFightListItem[] | null> {
  const fighters = await fightersRepository.listFightersByAccount({
    userId: user.id,
    email: user.email,
  });

  if (fighters.length === 0) {
    return null;
  }

  const fights = await listUniqueFightsForFighters(fighters);
  const contexts = await buildFightContexts(fighters, fights);

  return contexts.map((item) => {
    const readinessStatus = item.readiness?.status ?? "WAITING";

    return {
      id: item.fight.id,
      eventName: item.event.name,
      date: formatDisplayDate(item.event.date),
      opponent: item.opponent?.fullName ?? "TBD Opponent",
      venue: item.event.location,
      weight: item.fight.division,
      position: formatPositionLabel(item.fight.order),
      status: mapFightCardStatus(item.event.status, readinessStatus),
      statusClassName: mapFightCardStatusClassName(item.event.status, readinessStatus),
      group: classifyFightGroup(item.event.date, item.event.status),
    };
  });
}

export async function getFighterFightDetailForUser(
  user: Pick<AuthUser, "id" | "email" | "profile">,
  fightId: string,
): Promise<FighterFightDetailData | null> {
  const fighters = await fightersRepository.listFightersByAccount({
    userId: user.id,
    email: user.email,
  });

  if (fighters.length === 0) {
    return null;
  }

  const fight = await getFightById(fightId);
  const fighter = fight ? findAssignedFighter(fighters, fight) : null;

  if (!fight || !fighter) {
    return null;
  }

  const opponentFighterId = getOpponentFighterId(fight, fighter.id);

  const [event, opponent, readiness, eventRequirements, requirements] = await Promise.all([
    eventsRepository.findEventById(fight.eventId),
    opponentFighterId
      ? fightersRepository.findFighterById(opponentFighterId)
      : Promise.resolve(null),
    fighterReadinessRepository.findByEventAndFighter(fight.eventId, fighter.id),
    eventRequirementsRepository.listByEventId(fight.eventId),
    fighterRequirementsRepository.listByEventAndFighter(fight.eventId, fighter.id),
  ]);

  if (!event) {
    return null;
  }

  const [reminderHistory, documentSubmissions] = await Promise.all([
    reminderLogsRepository.listByEventAndFighter(event.id, fighter.id),
    documentSubmissionsRepository.listByEventAndFighter(event.id, fighter.id),
  ]);

  const contractRequirement = findSignedAgreementRequirement(eventRequirements, requirements);
  const contractStage = deriveContractStage(contractRequirement?.status ?? null, event.status);
  const isContractConfirmed = contractStage === "confirmed";
  const requirementSummary = summarizeRequirementStatuses(requirements);
  const documentOverview = buildDocumentOverview(
    eventRequirements,
    requirements,
    documentSubmissions,
  );
  const readinessStatus = readiness?.status ?? "WAITING";

  return {
    id: fight.id,
    eventName: event.name,
    titleLabel: formatPositionLabel(fight.order),
    date: formatDisplayDate(event.date),
    venue: event.location,
    location: event.location,
    time: formatDisplayTime(event.date),
    opponent: opponent?.fullName ?? "TBD Opponent",
    weight: fight.division,
    fightType: "3 x 5 Min Rounds",
    position: formatPositionLabel(fight.order),
    promotionContact: user.profile.displayName || "Operations Team",
    operationsEmail: "ops@fightops.ai",
    heroStatusLabel: mapFightCardStatus(event.status, readinessStatus),
    heroStatusClassName: mapFightCardStatusClassName(
      event.status,
      readinessStatus,
    ),
    contractName: fighter.contractReference ?? `${event.name} contract`,
    contractRequirementId: contractRequirement?.fighterRequirement?.id ?? null,
    contractVersion: contractRequirement?.eventRequirement.name
      ? `${contractRequirement.eventRequirement.name} - ${mapContractStageLabel(contractStage)}`
      : `Contract - ${mapContractStageLabel(contractStage)}`,
    contractStage,
    nextSteps: eventRequirements
      .filter((item) => !item.isSignedAgreement)
      .map((item) => ({
        id: item.id,
        title: item.name,
        description:
          item.description ?? "Complete this requirement to keep your readiness moving.",
        locked: !isContractConfirmed,
      })),
    requirementCounts: requirementSummary,
    fightOverview: {
      readinessPercentage:
        readiness?.readinessPercentage ?? calculateReadinessPercentage(requirements),
      readinessStatusLabel: mapReadinessStatusLabel(readinessStatus),
      nextAction: readiness?.nextAction ?? "Signed contract approval unlocks the next actions.",
      submittedDocuments: documentOverview.submittedDocuments.length,
      remainingDocuments: documentOverview.remainingDocuments.length,
      remindersSent: reminderHistory.filter((item) => item.status === "SENT").length,
    },
    fighterOverview: {
      fighterName: fighter.fullName,
      managerName: fighter.managerName ?? "Not provided",
      contactEmail: fighter.managerEmail ?? "Not provided",
      contactPhone: fighter.managerPhone ?? "Not provided",
      nationality: fighter.nationality ?? "Not provided",
      stance: fighter.stance ?? "Not provided",
      inviteStatus: mapInviteStatusLabel(fighter.inviteStatus),
    },
    submittedDocuments: documentOverview.submittedDocuments,
    remainingDocuments: documentOverview.remainingDocuments,
    reminderHistory: reminderHistory.map((item) => ({
      id: item.id,
      requirementName: item.requirementName,
      statusLabel: mapReminderStatusLabel(item.status),
      scheduledForLabel: formatDateTimeLabel(item.scheduledFor),
      sentAtLabel: item.sentAt ? formatDateTimeLabel(item.sentAt) : "Not sent yet",
    })),
  };
}

export async function getFighterDocumentsForUser(
  user: Pick<AuthUser, "id" | "email" | "profile">,
): Promise<FighterDocumentsPageData | null> {
  const fighters = await fightersRepository.listFightersByAccount({
    userId: user.id,
    email: user.email,
  });

  if (fighters.length === 0) {
    return null;
  }

  const fights = await listUniqueFightsForFighters(fighters);
  const requirementEntries = await Promise.all(
    fights.map(async (fight) => {
      const fighter = findAssignedFighter(fighters, fight);

      if (!fighter) {
        return [];
      }

      const [event, eventRequirements, fighterRequirements, submissions] = await Promise.all([
        eventsRepository.findEventById(fight.eventId),
        eventRequirementsRepository.listByEventId(fight.eventId),
        fighterRequirementsRepository.listByEventAndFighter(fight.eventId, fighter.id),
        documentSubmissionsRepository.listByEventAndFighter(fight.eventId, fighter.id),
      ]);

      if (!event) {
        return [];
      }

      const eventRequirementMap = new Map(
        eventRequirements.map((requirement) => [requirement.id, requirement]),
      );
      const latestSubmissionMap = new Map<string, (typeof submissions)[number]>();

      for (const submission of submissions) {
        if (!latestSubmissionMap.has(submission.fighterRequirementId)) {
          latestSubmissionMap.set(submission.fighterRequirementId, submission);
        }
      }

      return fighterRequirements.flatMap((requirement) => {
        const eventRequirement = eventRequirementMap.get(requirement.eventRequirementId);

        if (!eventRequirement || eventRequirement.inputType !== "document") {
          return [];
        }

        const submission = latestSubmissionMap.get(requirement.id);

        return [{
          id: requirement.id,
          eventId: event.id,
          eventName: event.name,
          fightId: requirement.fightId,
          title: eventRequirement.name,
          category: eventRequirement.category,
          status: requirement.status,
          statusLabel: mapRequirementStatusLabel(requirement.status),
          dueLabel: requirement.dueDate
            ? `Due ${formatDisplayDate(requirement.dueDate)}`
            : "No due date",
          acceptedFileTypes: eventRequirement.acceptedFileTypes,
          submissionId: submission?.id ?? null,
          fileName: submission?.originalFileName ?? null,
          publicUrl: submission?.publicUrl ?? null,
          reviewNote: submission?.reviewNote ?? null,
        }];
      });
    }),
  );

  const uniqueRequirements = Array.from(
    new Map(requirementEntries.flat().map((item) => [item.id, item])).values(),
  );
  const primaryFighter = pickPrimaryFighter(fighters, user.profile.displayName);

  return {
    fighterName: primaryFighter?.fullName ?? user.profile.displayName ?? "Fighter",
    requirements: uniqueRequirements,
  };
}

export async function getFighterNotificationsForUser(
  user: Pick<AuthUser, "id" | "email" | "profile">,
): Promise<FighterNotificationsPageData | null> {
  const fighters = await fightersRepository.listFightersByAccount({
    userId: user.id,
    email: user.email,
  });

  if (fighters.length === 0) {
    return null;
  }

  const fights = await listUniqueFightsForFighters(fighters);
  const eventIds = Array.from(new Set(fights.map((fight) => fight.eventId)));
  const eventNotifications = await Promise.all(
    eventIds.map(async (eventId) => {
      const [event, reminders] = await Promise.all([
        eventsRepository.findEventById(eventId),
        listEventReminders(eventId),
      ]);

      if (!event) {
        return [];
      }

      return reminders.reminders
        .filter((reminder) => fighters.some((fighter) => fighter.id === reminder.fighterId))
        .map((reminder) => ({
          id: reminder.id,
          eventName: event.name,
          requirementName: reminder.requirementName,
          status: reminder.status,
          statusLabel: mapReminderStatusLabel(reminder.status),
          scheduledForLabel: formatDateTimeLabel(reminder.scheduledFor),
          sentAtLabel: reminder.sentAt
            ? formatDateTimeLabel(reminder.sentAt)
            : "Not sent yet",
          dueDateLabel: reminder.dueDate
            ? formatDisplayDate(reminder.dueDate)
            : "No due date",
          message: reminder.message,
        }));
    }),
  );
  const primaryFighter = pickPrimaryFighter(fighters, user.profile.displayName);

  return {
    fighterName: primaryFighter?.fullName ?? user.profile.displayName ?? "Fighter",
    notifications: eventNotifications
      .flat()
      .sort((left, right) => right.scheduledForLabel.localeCompare(left.scheduledForLabel)),
  };
}

export async function getFighterHumanActionForUser(
  user: Pick<AuthUser, "id" | "email" | "profile">,
): Promise<FighterHumanActionPageData | null> {
  const fighters = await fightersRepository.listFightersByAccount({
    userId: user.id,
    email: user.email,
  });

  if (fighters.length === 0) {
    return null;
  }

  const fights = await listUniqueFightsForFighters(fighters);
  const contexts = await buildFightContexts(fighters, fights);
  const cases = await Promise.all(
    contexts.map(async (context) => {
      const eventRequirements = await eventRequirementsRepository.listByEventId(
        context.event.id,
      );
      const eventRequirementMap = new Map(
        eventRequirements.map((requirement) => [requirement.id, requirement]),
      );

      return context.requirements
        .filter(
          (requirement) =>
            requirement.status === "HUMAN_ACTION" ||
            requirement.status === "NEEDS_RESUBMISSION",
        )
        .map((requirement) => {
          const eventRequirement = eventRequirementMap.get(
            requirement.eventRequirementId,
          );

          return {
            id: requirement.id,
            eventName: context.event.name,
            fightId: context.fight.id,
            requirementName: eventRequirement?.name ?? "Requirement",
            status: requirement.status as "HUMAN_ACTION" | "NEEDS_RESUBMISSION",
            statusLabel: mapRequirementStatusLabel(requirement.status),
            reason:
              requirement.aiReason ??
              requirement.overrideReason ??
              (requirement.status === "HUMAN_ACTION"
                ? "This item needs operations review."
                : "Please submit a replacement document."),
            dueLabel: requirement.dueDate
              ? `Due ${formatDisplayDate(requirement.dueDate)}`
              : "No due date",
          };
        });
    }),
  );
  const primaryFighter = pickPrimaryFighter(fighters, user.profile.displayName);

  return {
    fighterName: primaryFighter?.fullName ?? user.profile.displayName ?? "Fighter",
    cases: cases
      .flat()
      .sort((left, right) => left.eventName.localeCompare(right.eventName)),
  };
}

async function buildFightContexts(fighters: FighterRecord[], fights: FightRecord[]) {
  const fighterMap = new Map(fighters.map((fighter) => [fighter.id, fighter]));

  const contexts = await Promise.all(
    fights.map(async (fight) => {
      const fighter = findAssignedFighter(fighters, fight);

      if (!fighter) {
        return null;
      }

      const opponentFighterId = getOpponentFighterId(fight, fighter.id);

      const [event, opponent, readiness, requirements] = await Promise.all([
        eventsRepository.findEventById(fight.eventId),
        opponentFighterId
          ? fightersRepository.findFighterById(opponentFighterId)
          : Promise.resolve(null),
        fighterReadinessRepository.findByEventAndFighter(fight.eventId, fighter.id),
        fighterRequirementsRepository.listByEventAndFighter(fight.eventId, fighter.id),
      ]);

      if (!event) {
        return null;
      }

      return {
        fight,
        event,
        fighter: fighterMap.get(fighter.id) ?? fighter,
        opponent,
        readiness,
        requirements,
      } satisfies FightContext;
    }),
  );

  return contexts
    .filter((item): item is FightContext => Boolean(item))
    .sort((left, right) => {
      const leftTime = new Date(left.event.date).getTime();
      const rightTime = new Date(right.event.date).getTime();
      return leftTime - rightTime;
    });
}

async function listUniqueFightsForFighters(fighters: FighterRecord[]) {
  const allFights = await Promise.all(
    fighters.map((fighter) => getFightsByFighterId(fighter.id)),
  );

  return Array.from(
    new Map(allFights.flat().map((fight) => [fight.id, fight])).values(),
  );
}

function pickPrimaryFighter(fighters: FighterRecord[], displayName: string) {
  return (
    fighters.find((fighter) => fighter.fullName === displayName) ??
    fighters.find((fighter) => fighter.userId !== null) ??
    fighters[0] ??
    null
  );
}

function findAssignedFighter(fighters: FighterRecord[], fight: FightRecord) {
  return (
    fighters.find((fighter) => fighter.id === fight.fighterAId || fighter.id === fight.fighterBId) ??
    null
  );
}

function buildDocumentOverview(
  eventRequirements: EventRequirementRecord[],
  fighterRequirements: FighterRequirementRecord[],
  documentSubmissions: Awaited<
    ReturnType<typeof documentSubmissionsRepository.listByEventAndFighter>
  >,
) {
  const eventRequirementMap = new Map(
    eventRequirements.map((requirement) => [requirement.id, requirement]),
  );
  const latestSubmissionByRequirementId = new Map<
    string,
    (typeof documentSubmissions)[number]
  >();

  for (const submission of documentSubmissions) {
    if (!latestSubmissionByRequirementId.has(submission.fighterRequirementId)) {
      latestSubmissionByRequirementId.set(submission.fighterRequirementId, submission);
    }
  }

  const submittedDocuments = fighterRequirements
    .filter((requirement) => {
      const eventRequirement = eventRequirementMap.get(requirement.eventRequirementId);
      return (
        eventRequirement?.inputType === "document" &&
        ["RECEIVED", "PROCESSING", "ACCEPTED", "HUMAN_ACTION", "NEEDS_RESUBMISSION"].includes(
          requirement.status,
        )
      );
    })
    .map((requirement) => {
      const eventRequirement = eventRequirementMap.get(requirement.eventRequirementId);
      const latestSubmission = latestSubmissionByRequirementId.get(requirement.id);

      return {
        id: requirement.id,
        title: eventRequirement?.name ?? "Document",
        statusLabel: mapRequirementStatusLabel(requirement.status),
        fileName: latestSubmission?.originalFileName ?? null,
        detail: requirement.completedAt
          ? `Completed ${formatDisplayDate(requirement.completedAt)}`
          : latestSubmission
            ? `Uploaded ${formatDisplayDate(latestSubmission.createdAt)}`
            : requirement.updatedAt
              ? `Updated ${formatDisplayDate(requirement.updatedAt)}`
            : "Recently submitted",
      };
    });

  const remainingDocuments = fighterRequirements
    .filter((requirement) => {
      const eventRequirement = eventRequirementMap.get(requirement.eventRequirementId);
      return eventRequirement?.inputType === "document" && requirement.status === "WAITING";
    })
    .map((requirement) => {
      const eventRequirement = eventRequirementMap.get(requirement.eventRequirementId);

      return {
        id: requirement.id,
        title: eventRequirement?.name ?? "Document",
        priorityLabel: mapPriorityLabel(requirement.priority),
        dueLabel: requirement.dueDate
          ? `Due ${formatDisplayDate(requirement.dueDate)}`
          : "No due date",
        statusLabel: mapRequirementStatusLabel(requirement.status),
      };
    });

  return {
    submittedDocuments,
    remainingDocuments,
  };
}

function classifyFightGroup(eventDateIso: string, eventStatus: string) {
  if (eventStatus === "completed") {
    return "completed";
  }

  const today = todayStartOfDayIso();
  const fightDate = startOfDayIso(eventDateIso);

  return fightDate < today ? "completed" : "upcoming";
}

function emptyRequirementSummary() {
  return {
    required: 0,
    verified: 0,
    pending: 0,
    rejected: 0,
  };
}

function summarizeRequirementStatuses(requirements: FighterRequirementRecord[]) {
  const mandatory = requirements.filter((item) => item.required);

  return {
    required: mandatory.length,
    verified: mandatory.filter((item) =>
      ["ACCEPTED", "NOT_APPLICABLE"].includes(item.status),
    ).length,
    pending: mandatory.filter((item) =>
      ["WAITING", "PROCESSING", "RECEIVED", "HUMAN_ACTION"].includes(item.status),
    ).length,
    rejected: mandatory.filter((item) => item.status === "NEEDS_RESUBMISSION").length,
  };
}

function findSignedAgreementRequirement(
  eventRequirements: EventRequirementRecord[],
  fighterRequirements: FighterRequirementRecord[],
) {
  const eventRequirement = eventRequirements.find((item) => item.isSignedAgreement);

  if (!eventRequirement) {
    return null;
  }

  const fighterRequirement =
    fighterRequirements.find((item) => item.eventRequirementId === eventRequirement.id) ?? null;

  return {
    eventRequirement,
    fighterRequirement,
    status: fighterRequirement?.status ?? null,
  };
}

function deriveContractStage(
  status: FighterRequirementStatus | null,
  eventStatus: string,
): "awaiting_signature" | "under_review" | "confirmed" {
  if (eventStatus === "completed") {
    return "confirmed";
  }

  if (!status || status === "WAITING" || status === "NEEDS_RESUBMISSION") {
    return "awaiting_signature";
  }

  if (status === "ACCEPTED" || status === "NOT_APPLICABLE") {
    return "confirmed";
  }

  return "under_review";
}

function mapFightCardStatus(eventStatus: string, readinessStatus: ReadinessStatus) {
  if (eventStatus === "completed") {
    return "Completed";
  }

  if (readinessStatus === "READY") {
    return "Confirmed";
  }

  if (readinessStatus === "PROCESSING") {
    return "Processing";
  }

  if (readinessStatus === "HUMAN_ACTION") {
    return "Needs review";
  }

  return "Pending";
}

function mapFightCardStatusClassName(eventStatus: string, readinessStatus: ReadinessStatus) {
  if (eventStatus === "completed") {
    return "border-[#d8e2f0] bg-[#f4f7fb] text-[#6982a7]";
  }

  if (readinessStatus === "READY") {
    return "border-[#b7ead1] bg-[#ecfbf2] text-[#108a43]";
  }

  if (readinessStatus === "PROCESSING") {
    return "border-[#b8cbff] bg-[#eef3ff] text-brand";
  }

  if (readinessStatus === "HUMAN_ACTION") {
    return "border-[#f7c4c0] bg-[#fff1f1] text-[#d92d20]";
  }

  return "border-[#ffd68a] bg-[#fff6df] text-[#cc7a00]";
}

function mapReadinessStatusLabel(readinessStatus: ReadinessStatus) {
  if (readinessStatus === "READY") {
    return "Confirmed";
  }

  if (readinessStatus === "PROCESSING") {
    return "Processing";
  }

  if (readinessStatus === "HUMAN_ACTION") {
    return "Needs review";
  }

  return "Pending";
}

function mapContractStageLabel(stage: "awaiting_signature" | "under_review" | "confirmed") {
  if (stage === "confirmed") {
    return "Confirmed";
  }

  if (stage === "under_review") {
    return "Under review";
  }

  return "Signature required";
}

function mapInviteStatusLabel(status: FighterRecord["inviteStatus"]) {
  if (status === "accepted") {
    return "Accepted";
  }

  return "Pending";
}

function mapReminderStatusLabel(status: "PENDING" | "SENT" | "SKIPPED" | "FAILED") {
  if (status === "SENT") {
    return "Sent";
  }

  if (status === "FAILED") {
    return "Failed";
  }

  if (status === "SKIPPED") {
    return "Skipped";
  }

  return "Queued";
}

function mapRequirementStatusLabel(status: FighterRequirementStatus) {
  if (status === "ACCEPTED") {
    return "Verified";
  }

  if (status === "RECEIVED") {
    return "Received";
  }

  if (status === "PROCESSING") {
    return "Processing";
  }

  if (status === "HUMAN_ACTION") {
    return "Needs review";
  }

  if (status === "NEEDS_RESUBMISSION") {
    return "Needs resubmission";
  }

  if (status === "NOT_APPLICABLE") {
    return "Not applicable";
  }

  return "Waiting";
}

function mapPriorityLabel(priority: FighterRequirementRecord["priority"]) {
  if (priority === "critical") {
    return "Critical";
  }

  if (priority === "high") {
    return "High";
  }

  if (priority === "medium") {
    return "Medium";
  }

  return "Low";
}

function formatPositionLabel(order: number) {
  if (order === 1) {
    return "Main Event";
  }

  if (order === 2) {
    return "Co-Main Event";
  }

  return `Bout ${String(order).padStart(2, "0")}`;
}

function formatDisplayDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(isoDate));
}

function formatDisplayTime(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  })
    .format(new Date(isoDate))
    .replace("AM", " AM GST")
    .replace("PM", " PM GST");
}

function formatDateTimeLabel(isoDate: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(new Date(isoDate));
}

function getOpponentFighterId(fight: FightRecord, fighterId: string) {
  if (fight.fighterAId === fighterId) {
    return fight.fighterBId;
  }

  return fight.fighterAId;
}

function startOfDayIso(isoDate: string) {
  const date = new Date(isoDate);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function todayStartOfDayIso() {
  return startOfDayIso(new Date().toISOString());
}
