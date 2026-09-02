import type { CreateEventInput, UpdateEventInput } from "@/types/event";
import type {
  EventRequirementRecord,
  FighterRequirementRecord,
  FighterRequirementStatus,
} from "@/types/readiness";
import { documentSubmissionsRepository } from "@/server/repositories/document-submissions.repository";
import { eventsRepository } from "@/server/repositories/events.repository";
import { eventRequirementsRepository } from "@/server/repositories/event-requirements.repository";
import { fightersRepository } from "@/server/repositories/fighters.repository";
import { fighterReadinessRepository } from "@/server/repositories/fighter-readiness.repository";
import { fighterRequirementsRepository } from "@/server/repositories/fighter-requirements.repository";
import { getFightById, getFightsByEventId } from "@/server/repositories/fights.repository";
import { reminderLogsRepository } from "@/server/repositories/reminder-logs.repository";
import { applyRequirementTemplatesToEvent } from "@/server/services/requirement-templates.service";
import {
  validateCreateEventInput,
  validateUpdateEventInput,
} from "@/server/validators/events.validator";

export type DashboardEventSummary = {
  id: string;
  slug: string;
  name: string;
  organization: string;
  date: string;
  location: string;
  fights: number;
  fighters: number;
  status: "draft" | "upcoming" | "active" | "completed";
  waitingItems: number;
  humanActionItems: number;
};

export type DashboardOverviewStats = Array<{
  label: string;
  value: string;
  hint: string;
  tone?: "warning" | "highlight";
}>;

export type DashboardEventDetail = DashboardEventSummary & {
  tabs: string[];
  readiness: {
    fights: {
      ready: number;
      waiting: number;
      humanAction: number;
    };
    fighters: {
      ready: number;
      waiting: number;
      humanAction: number;
    };
  };
  aiOperations: {
    overallReadinessPercent: number;
    completedAutomatically: number;
    activelyHandling: number;
    monitoredDeadlines: number;
    escalatedIssues: number;
    nextFollowUp: string;
    recentActivity: Array<{
      id: string;
      title: string;
      detail: string;
      tone: "success" | "brand" | "warning" | "danger";
    }>;
    criticalRisks: Array<{
      id: string;
      label: string;
      detail: string;
      tone: "critical" | "warning";
    }>;
  };
  bouts: Array<{
    id: string;
    label: string;
    order: string;
    division: string;
    readinessPercent: number;
    leftFighter: {
      name: string;
      division: string;
      country: string;
      stance: string;
      readinessLabel: string;
      readinessPercent: number;
      managerName?: string;
      managerEmail?: string;
      tags: Array<{
        label: string;
        tone: "success" | "warning" | "neutral" | "processing";
      }>;
    };
    rightFighter: {
      name: string;
      division: string;
      country: string;
      stance: string;
      readinessLabel: string;
      readinessPercent: number;
      managerName?: string;
      managerEmail?: string;
      tags: Array<{
        label: string;
        tone: "success" | "warning" | "neutral" | "processing";
      }>;
    };
  }>;
};

export type PromoterFightDetailData = {
  id: string;
  eventSlug: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  bout: DashboardEventDetail["bouts"][number];
  requirements: Array<{
    name: string;
    dueDate: string;
    priority: "critical" | "high" | "medium" | "low";
    leftStatus: "accepted" | "missing" | "under_review";
    leftConfidence: string;
    leftNote: string;
    leftSubmissionId: string | null;
    leftFileName: string | null;
    leftSubmittedAt: string | null;
    rightStatus: "accepted" | "missing" | "under_review";
    rightConfidence: string;
    rightNote: string;
    rightSubmissionId: string | null;
    rightFileName: string | null;
    rightSubmittedAt: string | null;
  }>;
  insight: {
    completed: number;
    missing: number;
    underReview: number;
    waitingFor: Array<{
      label: string;
      tone: "critical" | "high";
    }>;
    nextAction: string;
  };
  fighterOverviews: Array<{
    fighterId: string | null;
    sideLabel: string;
    fighterName: string;
    division: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    contractReference: string;
    inviteStatusLabel: string;
    inviteAcceptedAtLabel: string;
    contractStatusLabel: string;
    contractDueDateLabel: string;
    isContractOverdue: boolean;
    recommendedAction: string;
    actions: Array<"reinvite" | "replace">;
  }>;
};

export type PromoterEventFighterListData = {
  event: {
    id: string;
    slug: string;
    name: string;
    date: string;
    location: string;
  };
  summary: {
    total: number;
    ready: number;
    aiHandling: number;
    humanAction: number;
    waiting: number;
  };
  fighters: Array<{
    id: string;
    fightId: string | null;
    name: string;
    opponent: string;
    weightClass: string;
    managerName: string;
    contactEmail: string;
    readinessPercent: number;
    status: "ready" | "ai_handling" | "human_action" | "waiting";
    statusLabel: string;
    nextAction: string;
    contract: string;
    documents: string;
    medical: string;
    visa: string;
    travel: string;
    accommodation: string;
  }>;
};

export type PromoterEventFighterDetailData = {
  event: PromoterEventFighterListData["event"];
  fighter: {
    id: string;
    name: string;
    managerName: string;
    contactEmail: string;
    contactPhone: string;
    nationality: string;
    stance: string;
    inviteStatus: string;
    inviteAcceptedAt: string;
    contractReference: string;
  };
  fight: {
    id: string | null;
    opponent: string;
    weightClass: string;
    position: string;
  };
  readiness: {
    percentage: number;
    statusLabel: string;
    nextAction: string;
    completed: number;
    pending: number;
    needsReview: number;
    missing: number;
  };
  requirementGroups: Array<{
    category: string;
    total: number;
    completed: number;
    statusLabel: string;
  }>;
  requirements: Array<{
    id: string;
    name: string;
    category: string;
    priority: string;
    statusLabel: string;
    dueLabel: string;
    description: string;
    fileName: string | null;
    submittedAt: string | null;
    reviewNote: string | null;
  }>;
  timeline: Array<{
    id: string;
    title: string;
    detail: string;
    timestamp: string;
    tone: "success" | "warning" | "danger" | "brand" | "neutral";
  }>;
};

const defaultTabs = [
  "Fight Card",
  "Fighters",
  "Event Readiness",
  "Required Documents",
  "Post Reminders",
];
const CURRENT_LOCAL_DATE = "2026-08-31T00:00:00.000Z";

export async function listEvents() {
  return eventsRepository.listEvents();
}

export async function getEventById(eventId: string) {
  return eventsRepository.findEventById(eventId);
}

export async function getEventBySlug(slug: string) {
  return eventsRepository.findEventBySlug(slug);
}

export async function createEvent(input: CreateEventInput, createdByUserId: string) {
  validateCreateEventInput(input);

  const slug = await createUniqueSlug(input.name);
  const status = resolveEventStatus(input.date);

  const event = await eventsRepository.createEvent({
    ...input,
    status,
    slug,
    createdByUserId,
  });

  await applyRequirementTemplatesToEvent({
    eventId: event.id,
    ownerUserId: createdByUserId,
    eventDate: event.date,
    templateIds: input.templateIds,
  });

  return event;
}

export async function updateEvent(eventId: string, input: UpdateEventInput) {
  validateUpdateEventInput(input);

  const slug = input.name ? await createUniqueSlug(input.name, eventId) : undefined;
  const status = input.date ? resolveEventStatus(input.date) : input.status;

  return eventsRepository.updateEvent(eventId, {
    ...input,
    status,
    slug,
  });
}

export async function deleteEvent(eventId: string) {
  return eventsRepository.deleteEvent(eventId);
}

export async function listPromoterDashboardEvents(): Promise<DashboardEventSummary[]> {
  const events = await eventsRepository.listEvents();
  const activeEventId = findCurrentEventId(events);

  return Promise.all(
    events.map(async (event) => {
      const metrics = await eventsRepository.getEventSummaryMetrics(event.id);

      return {
        id: event.id,
        slug: event.slug,
        name: event.name,
        organization: "FightOps Arena",
        date: formatDateOnly(event.date),
        location: event.location,
        fights: metrics.fights,
        fighters: metrics.fighters,
        status: resolveDashboardEventStatus(event.date, event.id === activeEventId),
        waitingItems: 0,
        humanActionItems: 0,
      };
    }),
  );
}

function findCurrentEventId(events: Array<{ id: string; date: string }>) {
  const today = new Date();
  const todayTime = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );

  return events
    .filter((event) => startOfDayIso(event.date) >= todayTime)
    .sort((left, right) => startOfDayIso(left.date) - startOfDayIso(right.date))[0]?.id;
}

function resolveDashboardEventStatus(
  date: string,
  isCurrentEvent: boolean,
): DashboardEventSummary["status"] {
  const today = new Date();
  const todayTime = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const eventTime = startOfDayIso(date);

  if (eventTime < todayTime) {
    return "completed";
  }

  return isCurrentEvent ? "active" : "upcoming";
}

export async function getPromoterOverviewStats(): Promise<DashboardOverviewStats> {
  const events = await listPromoterDashboardEvents();
  const totalFighters = events.reduce((sum, event) => sum + event.fighters, 0);
  const activeEvent = events.find((event) => event.status === "active") ?? events[0];
  const requirementGroups = await Promise.all(
    events.map((event) => fighterRequirementsRepository.listByEventId(event.id)),
  );
  const requirements = requirementGroups.flat();
  const waitingItems = requirements.filter((requirement) =>
    ["WAITING", "PROCESSING", "NEEDS_RESUBMISSION"].includes(requirement.status),
  ).length;
  const humanActionItems = requirements.filter(
    (requirement) => requirement.status === "HUMAN_ACTION",
  ).length;

  return [
    {
      label: "Active Event",
      value: activeEvent ? activeEvent.name : "None",
      hint: activeEvent ? activeEvent.date : "create an event",
    },
    { label: "Fighters", value: String(totalFighters), hint: "assigned" },
    {
      label: "Waiting",
      value: String(waitingItems),
      hint: "items in progress",
      tone: "warning",
    },
    {
      label: "Human Action",
      value: String(humanActionItems),
      hint: "needs review",
      tone: "highlight",
    },
  ];
}

export async function getPromoterEventDetailsBySlug(
  slug: string,
): Promise<DashboardEventDetail | null> {
  const event = await eventsRepository.findEventBySlug(slug);

  if (!event) {
    return null;
  }

  const metrics = await eventsRepository.getEventSummaryMetrics(event.id);
  const fights = await getFightsByEventId(event.id);
  const fighterIds = Array.from(
    new Set(
      fights
        .flatMap((fight) => [fight.fighterAId, fight.fighterBId])
        .filter((fighterId): fighterId is string => Boolean(fighterId)),
    ),
  );
  const [
    fighters,
    readinessItems,
    eventRequirements,
    fighterRequirements,
    reminderLogs,
    documentSubmissions,
  ] = await Promise.all([
    fightersRepository.listFightersByIds(fighterIds),
    fighterReadinessRepository.listByEventId(event.id),
    eventRequirementsRepository.listByEventId(event.id),
    fighterRequirementsRepository.listByEventId(event.id),
    reminderLogsRepository.listByEventId(event.id),
    documentSubmissionsRepository.listRecentForEvents([event.id]),
  ]);

  const fighterMap = new Map(fighters.map((fighter) => [fighter.id, fighter]));
  const readinessMap = new Map(
    readinessItems.map((readiness) => [readiness.fighterId, readiness]),
  );

  const fightReadyCount = fights.filter((fight) => fight.status === "READY").length;
  const fightHumanActionCount = fights.filter(
    (fight) => fight.status === "HUMAN_ACTION",
  ).length;
  const fightWaitingCount = Math.max(
    fights.length - fightReadyCount - fightHumanActionCount,
    0,
  );

  const fighterReadyCount = readinessItems.filter(
    (readiness) => readiness.status === "READY",
  ).length;
  const fighterHumanActionCount = readinessItems.filter(
    (readiness) => readiness.status === "HUMAN_ACTION",
  ).length;
  const fighterWaitingCount = Math.max(
    readinessItems.length - fighterReadyCount - fighterHumanActionCount,
    0,
  );
  const aiOperations = buildEventAiOperations({
    eventName: event.name,
    readinessItems,
    eventRequirements,
    fighterRequirements,
    reminderLogs,
    documentSubmissions,
  });

  return {
    id: event.id,
    slug: event.slug,
    name: event.name,
    organization: "FightOps Arena",
    date: formatDateOnly(event.date),
    location: event.location,
    fights: metrics.fights,
    fighters: metrics.fighters,
    status: event.status === "completed" ? "active" : event.status,
    waitingItems: 0,
    humanActionItems: 0,
    tabs: defaultTabs,
    readiness: {
      fights: {
        ready: fightReadyCount,
        waiting: fightWaitingCount,
        humanAction: fightHumanActionCount,
      },
      fighters: {
        ready: fighterReadyCount,
        waiting: fighterWaitingCount,
        humanAction: fighterHumanActionCount,
      },
    },
    aiOperations,
    bouts: fights.map((fight) => {
      const fighterA = fight.fighterAId ? fighterMap.get(fight.fighterAId) : null;
      const fighterB = fight.fighterBId ? fighterMap.get(fight.fighterBId) : null;
      const readinessA = fight.fighterAId ? readinessMap.get(fight.fighterAId) : null;
      const readinessB = fight.fighterBId ? readinessMap.get(fight.fighterBId) : null;

      return {
        id: fight.id,
        label: `Bout ${String(fight.order).padStart(2, "0")}`,
        order: String(fight.order).padStart(2, "0"),
        division: fight.division,
        readinessPercent: Math.round(
          ((readinessA?.readinessPercentage ?? 0) +
            (readinessB?.readinessPercentage ?? 0)) /
            2,
        ),
        leftFighter: mapDashboardFighter(fighterA, readinessA, fight.division),
        rightFighter: mapDashboardFighter(fighterB, readinessB, fight.division),
      };
    }),
  };
}

export async function getPromoterEventFighterListBySlug(
  slug: string,
): Promise<PromoterEventFighterListData | null> {
  const event = await eventsRepository.findEventBySlug(slug);

  if (!event) {
    return null;
  }

  const fights = await getFightsByEventId(event.id);
  const fighterIds = Array.from(
    new Set(
      fights
        .flatMap((fight) => [fight.fighterAId, fight.fighterBId])
        .filter((fighterId): fighterId is string => Boolean(fighterId)),
    ),
  );
  const [fighters, readinessItems, eventRequirements, fighterRequirements] =
    await Promise.all([
      fightersRepository.listFightersByIds(fighterIds),
      fighterReadinessRepository.listByEventId(event.id),
      eventRequirementsRepository.listByEventId(event.id),
      fighterRequirementsRepository.listByEventId(event.id),
    ]);

  const fighterMap = new Map(fighters.map((fighter) => [fighter.id, fighter]));
  const readinessMap = new Map(
    readinessItems.map((readiness) => [readiness.fighterId, readiness]),
  );
  const eventRequirementMap = new Map(
    eventRequirements.map((requirement) => [requirement.id, requirement]),
  );
  const requirementsByFighterId = new Map<string, FighterRequirementRecord[]>();
  const fightByFighterId = new Map<
    string,
    { fightId: string; opponentFighterId: string | null; division: string }
  >();

  for (const requirement of fighterRequirements) {
    const current = requirementsByFighterId.get(requirement.fighterId) ?? [];
    current.push(requirement);
    requirementsByFighterId.set(requirement.fighterId, current);
  }

  for (const fight of fights) {
    if (fight.fighterAId) {
      fightByFighterId.set(fight.fighterAId, {
        fightId: fight.id,
        opponentFighterId: fight.fighterBId,
        division: fight.division,
      });
    }

    if (fight.fighterBId) {
      fightByFighterId.set(fight.fighterBId, {
        fightId: fight.id,
        opponentFighterId: fight.fighterAId,
        division: fight.division,
      });
    }
  }

  const fightersList = fighters
    .map((fighter) => {
      const readiness = readinessMap.get(fighter.id) ?? null;
      const fight = fightByFighterId.get(fighter.id) ?? null;
      const opponent = fight?.opponentFighterId
        ? fighterMap.get(fight.opponentFighterId)
        : null;
      const requirements = requirementsByFighterId.get(fighter.id) ?? [];

      return {
        id: fighter.id,
        fightId: fight?.fightId ?? null,
        name: fighter.fullName,
        opponent: opponent?.fullName ?? "TBD",
        weightClass: fighter.division ?? fight?.division ?? "TBD",
        managerName: fighter.managerName ?? "Not assigned",
        contactEmail: fighter.managerEmail ?? "Not assigned",
        readinessPercent: readiness?.readinessPercentage ?? 0,
        status: mapEventFighterStatus(readiness?.status ?? "WAITING"),
        statusLabel: mapEventFighterStatusLabel(readiness?.status ?? "WAITING"),
        nextAction: readiness?.nextAction ?? "Waiting for readiness activity.",
        contract: summarizeRequirementGroup({
          requirements,
          eventRequirementMap,
          matcher: (requirement) => requirement.isSignedAgreement,
        }),
        documents: summarizeRequirementGroup({
          requirements,
          eventRequirementMap,
          matcher: (requirement) => requirement.category === "Legal",
        }),
        medical: summarizeRequirementGroup({
          requirements,
          eventRequirementMap,
          matcher: (requirement) => requirement.category === "Medical",
        }),
        visa: summarizeRequirementGroup({
          requirements,
          eventRequirementMap,
          matcher: (requirement) => requirement.category === "Visa",
        }),
        travel: summarizeRequirementGroup({
          requirements,
          eventRequirementMap,
          matcher: (requirement) => requirement.category === "Travel",
        }),
        accommodation: summarizeRequirementGroup({
          requirements,
          eventRequirementMap,
          matcher: (requirement) => requirement.category === "Accommodation",
        }),
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    event: {
      id: event.id,
      slug: event.slug,
      name: event.name,
      date: formatDateOnly(event.date),
      location: event.location,
    },
    summary: {
      total: fightersList.length,
      ready: fightersList.filter((fighter) => fighter.status === "ready").length,
      aiHandling: fightersList.filter((fighter) => fighter.status === "ai_handling").length,
      humanAction: fightersList.filter((fighter) => fighter.status === "human_action").length,
      waiting: fightersList.filter((fighter) => fighter.status === "waiting").length,
    },
    fighters: fightersList,
  };
}

export async function getPromoterEventFighterDetailBySlugAndId(
  slug: string,
  fighterId: string,
): Promise<PromoterEventFighterDetailData | null> {
  const event = await eventsRepository.findEventBySlug(slug);
  const fighter = await fightersRepository.findFighterById(fighterId);

  if (!event || !fighter) {
    return null;
  }

  const fights = await getFightsByEventId(event.id);
  const fight =
    fights.find(
      (item) => item.fighterAId === fighter.id || item.fighterBId === fighter.id,
    ) ?? null;

  if (!fight) {
    return null;
  }

  const opponentId =
    fight.fighterAId === fighter.id ? fight.fighterBId : fight.fighterAId;

  const [
    opponent,
    readiness,
    eventRequirements,
    fighterRequirements,
    documentSubmissions,
    reminderHistory,
  ] = await Promise.all([
    opponentId ? fightersRepository.findFighterById(opponentId) : Promise.resolve(null),
    fighterReadinessRepository.findByEventAndFighter(event.id, fighter.id),
    eventRequirementsRepository.listByEventId(event.id),
    fighterRequirementsRepository.listByEventAndFighter(event.id, fighter.id),
    documentSubmissionsRepository.listByEventAndFighter(event.id, fighter.id),
    reminderLogsRepository.listByEventAndFighter(event.id, fighter.id),
  ]);
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

  const completed = fighterRequirements.filter((requirement) =>
    ["ACCEPTED", "NOT_APPLICABLE"].includes(requirement.status),
  ).length;
  const needsReview = fighterRequirements.filter((requirement) =>
    ["RECEIVED", "PROCESSING", "HUMAN_ACTION"].includes(requirement.status),
  ).length;
  const missing = fighterRequirements.filter((requirement) =>
    ["WAITING", "NEEDS_RESUBMISSION"].includes(requirement.status),
  ).length;
  const readinessStatus = readiness?.status ?? "WAITING";

  return {
    event: {
      id: event.id,
      slug: event.slug,
      name: event.name,
      date: formatDateOnly(event.date),
      location: event.location,
    },
    fighter: {
      id: fighter.id,
      name: fighter.fullName,
      managerName: fighter.managerName ?? "Not assigned",
      contactEmail: fighter.managerEmail ?? "Not assigned",
      contactPhone: fighter.managerPhone ?? "Not provided",
      nationality: fighter.nationality ?? "Not provided",
      stance: fighter.stance ?? "Not provided",
      inviteStatus: fighter.inviteStatus === "accepted" ? "Accepted" : "Pending",
      inviteAcceptedAt: fighter.inviteAcceptedAt
        ? formatDateTimeLabel(fighter.inviteAcceptedAt)
        : "Not accepted yet",
      contractReference: fighter.contractReference ?? "Not assigned",
    },
    fight: {
      id: fight.id,
      opponent: opponent?.fullName ?? "TBD",
      weightClass: fighter.division ?? fight.division,
      position: formatPromoterPositionLabel(fight.order),
    },
    readiness: {
      percentage: readiness?.readinessPercentage ?? 0,
      statusLabel: mapEventFighterStatusLabel(readinessStatus),
      nextAction: readiness?.nextAction ?? "Waiting for readiness activity.",
      completed,
      pending: needsReview,
      needsReview,
      missing,
    },
    requirementGroups: buildPromoterRequirementGroups(
      fighterRequirements,
      eventRequirementMap,
    ),
    requirements: fighterRequirements.map((requirement) => {
      const eventRequirement = eventRequirementMap.get(requirement.eventRequirementId);
      const submission = latestSubmissionByRequirementId.get(requirement.id);

      return {
        id: requirement.id,
        name: eventRequirement?.name ?? "Requirement",
        category: eventRequirement?.category ?? "Operations",
        priority: mapPriorityLabel(requirement.priority),
        statusLabel: mapRequirementStatusLabel(requirement.status),
        dueLabel: requirement.dueDate
          ? `Due ${formatDisplayDate(requirement.dueDate)}`
          : "No due date",
        description:
          requirement.overrideReason ??
          requirement.aiReason ??
          eventRequirement?.description ??
          "Complete this requirement to keep fighter readiness moving.",
        fileName: submission?.originalFileName ?? null,
        submittedAt: submission ? formatDateTimeLabel(submission.createdAt) : null,
        reviewNote: submission?.reviewNote ?? null,
      };
    }),
    timeline: buildPromoterFighterTimeline({
      fighterName: fighter.fullName,
      fighterRequirements,
      eventRequirementMap,
      documentSubmissions,
      reminderHistory,
    }),
  };
}

export async function getPromoterFightDetailBySlugAndId(
  eventSlug: string,
  fightId: string,
): Promise<PromoterFightDetailData | null> {
  const event = await eventsRepository.findEventBySlug(eventSlug);
  const fight = await getFightById(fightId);

  if (!event || !fight || fight.eventId !== event.id) {
    return null;
  }

  const eventRequirements = await eventRequirementsRepository.listByEventId(event.id);
  const [
    leftFighter,
    rightFighter,
    leftReadiness,
    rightReadiness,
    leftRequirements,
    rightRequirements,
    leftSubmissions,
    rightSubmissions,
  ] =
    await Promise.all([
      fight.fighterAId ? fightersRepository.findFighterById(fight.fighterAId) : Promise.resolve(null),
      fight.fighterBId ? fightersRepository.findFighterById(fight.fighterBId) : Promise.resolve(null),
      fight.fighterAId
        ? fighterReadinessRepository.findByEventAndFighter(event.id, fight.fighterAId)
        : Promise.resolve(null),
      fight.fighterBId
        ? fighterReadinessRepository.findByEventAndFighter(event.id, fight.fighterBId)
        : Promise.resolve(null),
      fight.fighterAId
        ? fighterRequirementsRepository.listByEventAndFighter(event.id, fight.fighterAId)
        : Promise.resolve([]),
      fight.fighterBId
        ? fighterRequirementsRepository.listByEventAndFighter(event.id, fight.fighterBId)
        : Promise.resolve([]),
      fight.fighterAId
        ? documentSubmissionsRepository.listByEventAndFighter(event.id, fight.fighterAId)
        : Promise.resolve([]),
      fight.fighterBId
        ? documentSubmissionsRepository.listByEventAndFighter(event.id, fight.fighterBId)
        : Promise.resolve([]),
    ]);

  const bout = {
    id: fight.id,
    label: `Bout ${String(fight.order).padStart(2, "0")}`,
    order: String(fight.order).padStart(2, "0"),
    division: fight.division,
    readinessPercent: Math.round(
      ((leftReadiness?.readinessPercentage ?? 0) +
        (rightReadiness?.readinessPercentage ?? 0)) / 2,
    ),
    leftFighter: mapDashboardFighter(leftFighter, leftReadiness, fight.division),
    rightFighter: mapDashboardFighter(rightFighter, rightReadiness, fight.division),
  };

  const requirements = eventRequirements.map((requirement) => {
    const leftRequirement =
      leftRequirements.find((item) => item.eventRequirementId === requirement.id) ?? null;
    const rightRequirement =
      rightRequirements.find((item) => item.eventRequirementId === requirement.id) ?? null;
    const leftSubmission = leftRequirement?.latestSubmissionId
      ? leftSubmissions.find((item) => item.id === leftRequirement.latestSubmissionId) ?? null
      : null;
    const rightSubmission = rightRequirement?.latestSubmissionId
      ? rightSubmissions.find((item) => item.id === rightRequirement.latestSubmissionId) ?? null
      : null;

    return {
      name: requirement.name,
      dueDate: requirement.dueDate ? formatDateOnly(requirement.dueDate) : "No due date",
      priority: requirement.priority,
      leftStatus: mapRequirementStatusForPromoter(leftRequirement?.status ?? "WAITING"),
      leftConfidence: mapRequirementConfidence(leftRequirement),
      leftNote: mapRequirementNote(requirement, leftRequirement),
      leftSubmissionId: leftSubmission?.id ?? null,
      leftFileName: leftSubmission?.originalFileName ?? null,
      leftSubmittedAt: leftSubmission ? formatDateTimeLabel(leftSubmission.createdAt) : null,
      rightStatus: mapRequirementStatusForPromoter(rightRequirement?.status ?? "WAITING"),
      rightConfidence: mapRequirementConfidence(rightRequirement),
      rightNote: mapRequirementNote(requirement, rightRequirement),
      rightSubmissionId: rightSubmission?.id ?? null,
      rightFileName: rightSubmission?.originalFileName ?? null,
      rightSubmittedAt: rightSubmission ? formatDateTimeLabel(rightSubmission.createdAt) : null,
    };
  });

  const allRequirements = [...leftRequirements, ...rightRequirements];
  const signedAgreementRequirement =
    eventRequirements.find((item) => item.isSignedAgreement) ?? null;
  const leftSignedAgreement = signedAgreementRequirement
    ? leftRequirements.find(
        (item) => item.eventRequirementId === signedAgreementRequirement.id,
      ) ?? null
    : null;
  const rightSignedAgreement = signedAgreementRequirement
    ? rightRequirements.find(
        (item) => item.eventRequirementId === signedAgreementRequirement.id,
      ) ?? null
    : null;

  return {
    id: fight.id,
    eventSlug: event.slug,
    eventName: event.name,
    eventDate: formatDateOnly(event.date),
    eventLocation: event.location,
    bout,
    requirements,
    insight: {
      completed: allRequirements.filter((item) =>
        ["ACCEPTED", "NOT_APPLICABLE"].includes(item.status),
      ).length,
      missing: allRequirements.filter((item) =>
        ["WAITING", "NEEDS_RESUBMISSION"].includes(item.status),
      ).length,
      underReview: allRequirements.filter((item) =>
        ["RECEIVED", "PROCESSING", "HUMAN_ACTION"].includes(item.status),
      ).length,
      waitingFor: buildFightInsightWaitingFor(eventRequirements, leftRequirements, rightRequirements),
      nextAction: buildFightInsightNextAction(
        eventRequirements,
        leftRequirements,
        rightRequirements,
      ),
    },
    fighterOverviews: [
      buildPromoterFighterOverview({
        sideLabel: "Fighter A",
        fighterId: fight.fighterAId,
        fighter: leftFighter,
        signedAgreementRequirement,
        requirement: leftSignedAgreement,
      }),
      buildPromoterFighterOverview({
        sideLabel: "Fighter B",
        fighterId: fight.fighterBId,
        fighter: rightFighter,
        signedAgreementRequirement,
        requirement: rightSignedAgreement,
      }),
    ],
  };
}

async function createUniqueSlug(name: string, currentEventId?: string) {
  const baseSlug = slugify(name);
  let candidate = baseSlug;
  let suffix = 1;

  while (true) {
    const existingEvent = await eventsRepository.findEventBySlug(candidate);

    if (!existingEvent || existingEvent.id === currentEventId) {
      return candidate;
    }

    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
}

function slugify(input: string) {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "event"
  );
}

function formatDateOnly(isoDate: string) {
  return isoDate.slice(0, 10);
}

function mapDashboardFighter(
  fighter:
    | {
        fullName: string;
        nationality: string | null;
        stance: string | null;
        division: string | null;
        managerName: string | null;
        managerEmail: string | null;
      }
    | null
    | undefined,
  readiness:
    | {
        status: "READY" | "WAITING" | "HUMAN_ACTION" | "PROCESSING";
        readinessPercentage: number;
      }
    | null
    | undefined,
  division: string,
) {
  const readinessLabel =
    readiness?.status === "READY"
      ? "Ready"
      : readiness?.status === "HUMAN_ACTION"
        ? "Human Action"
        : readiness?.status === "PROCESSING"
          ? "Processing"
          : "Waiting";

  const primaryTone =
    readiness?.status === "READY"
      ? "success"
      : readiness?.status === "PROCESSING"
        ? "processing"
        : "warning";

  return {
    name: fighter?.fullName ?? "TBD Fighter",
    division: fighter?.division ?? division,
    country: fighter?.nationality ?? "TBD",
    stance: fighter?.stance ?? "TBD",
    readinessLabel,
    readinessPercent: readiness?.readinessPercentage ?? 0,
    managerName: fighter?.managerName ?? undefined,
    managerEmail: fighter?.managerEmail ?? undefined,
    tags: [
      { label: readinessLabel, tone: primaryTone as "success" | "warning" | "processing" },
    ],
  };
}

function mapRequirementStatusForPromoter(
  status: FighterRequirementStatus,
): "accepted" | "missing" | "under_review" {
  if (status === "ACCEPTED" || status === "NOT_APPLICABLE") {
    return "accepted";
  }

  if (status === "WAITING" || status === "NEEDS_RESUBMISSION") {
    return "missing";
  }

  return "under_review";
}

function mapRequirementConfidence(
  requirement: FighterRequirementRecord | null,
) {
  if (!requirement) {
    return "Awaiting upload";
  }

  if (typeof requirement.aiConfidence === "number") {
    return `${requirement.aiConfidence}% confidence`;
  }

  if (requirement.status === "ACCEPTED" || requirement.status === "NOT_APPLICABLE") {
    return "Verified";
  }

  if (requirement.status === "WAITING") {
    return "Awaiting upload";
  }

  if (requirement.status === "NEEDS_RESUBMISSION") {
    return "Action needed";
  }

  return "In review";
}

function mapRequirementNote(
  eventRequirement: EventRequirementRecord,
  requirement: FighterRequirementRecord | null,
) {
  if (requirement?.aiReason) {
    return requirement.aiReason;
  }

  if (!requirement || requirement.status === "WAITING") {
    return eventRequirement.description ?? "Waiting for fighter submission.";
  }

  if (requirement.status === "NEEDS_RESUBMISSION") {
    return "Submission needs to be uploaded again before approval.";
  }

  if (requirement.status === "ACCEPTED" || requirement.status === "NOT_APPLICABLE") {
    return "Requirement has been accepted.";
  }

  if (requirement.status === "HUMAN_ACTION") {
    return "Escalated for manual review.";
  }

  if (requirement.status === "PROCESSING") {
    return "Document is currently being processed.";
  }

  return "Submission has been received and is awaiting review.";
}

function mapEventFighterStatus(
  status: "READY" | "WAITING" | "HUMAN_ACTION" | "PROCESSING",
): PromoterEventFighterListData["fighters"][number]["status"] {
  if (status === "READY") {
    return "ready";
  }

  if (status === "HUMAN_ACTION") {
    return "human_action";
  }

  if (status === "PROCESSING") {
    return "ai_handling";
  }

  return "waiting";
}

function mapEventFighterStatusLabel(status: "READY" | "WAITING" | "HUMAN_ACTION" | "PROCESSING") {
  if (status === "READY") {
    return "Ready";
  }

  if (status === "HUMAN_ACTION") {
    return "Human action";
  }

  if (status === "PROCESSING") {
    return "AI handling";
  }

  return "Waiting";
}

function summarizeRequirementGroup(params: {
  requirements: FighterRequirementRecord[];
  eventRequirementMap: Map<string, EventRequirementRecord>;
  matcher: (requirement: EventRequirementRecord) => boolean;
}) {
  const matchingRequirements = params.requirements.filter((requirement) => {
    const eventRequirement = params.eventRequirementMap.get(
      requirement.eventRequirementId,
    );
    return eventRequirement ? params.matcher(eventRequirement) : false;
  });

  if (matchingRequirements.length === 0) {
    return "Not required";
  }

  const accepted = matchingRequirements.filter((requirement) =>
    ["ACCEPTED", "NOT_APPLICABLE"].includes(requirement.status),
  ).length;
  const humanAction = matchingRequirements.some(
    (requirement) => requirement.status === "HUMAN_ACTION",
  );
  const underReview = matchingRequirements.some((requirement) =>
    ["RECEIVED", "PROCESSING"].includes(requirement.status),
  );
  const needsResubmission = matchingRequirements.some(
    (requirement) => requirement.status === "NEEDS_RESUBMISSION",
  );

  if (accepted === matchingRequirements.length) {
    return "Complete";
  }

  if (humanAction) {
    return "Human action";
  }

  if (needsResubmission) {
    return "Needs resubmission";
  }

  if (underReview) {
    return "Under review";
  }

  return `${accepted}/${matchingRequirements.length} complete`;
}

function buildEventAiOperations(params: {
  eventName: string;
  readinessItems: Awaited<ReturnType<typeof fighterReadinessRepository.listByEventId>>;
  eventRequirements: EventRequirementRecord[];
  fighterRequirements: FighterRequirementRecord[];
  reminderLogs: Awaited<ReturnType<typeof reminderLogsRepository.listByEventId>>;
  documentSubmissions: Awaited<
    ReturnType<typeof documentSubmissionsRepository.listRecentForEvents>
  >;
}): DashboardEventDetail["aiOperations"] {
  const mandatoryRequirements = params.fighterRequirements.filter(
    (requirement) => requirement.required,
  );
  const completedAutomatically = mandatoryRequirements.filter((requirement) =>
    ["ACCEPTED", "NOT_APPLICABLE"].includes(requirement.status),
  ).length;
  const activelyHandling = mandatoryRequirements.filter((requirement) =>
    ["WAITING", "PROCESSING", "RECEIVED", "NEEDS_RESUBMISSION"].includes(
      requirement.status,
    ),
  ).length;
  const escalatedIssues = mandatoryRequirements.filter(
    (requirement) => requirement.status === "HUMAN_ACTION",
  ).length;
  const monitoredDeadlines = mandatoryRequirements.filter(
    (requirement) => requirement.dueDate && !["ACCEPTED", "NOT_APPLICABLE"].includes(requirement.status),
  ).length;
  const overallReadinessPercent =
    params.readinessItems.length === 0
      ? 0
      : Math.round(
          params.readinessItems.reduce(
            (sum, readiness) => sum + readiness.readinessPercentage,
            0,
          ) / params.readinessItems.length,
        );
  const nextPendingReminder =
    params.reminderLogs
      .filter((reminder) => reminder.status === "PENDING")
      .sort(
        (left, right) =>
          new Date(left.scheduledFor).getTime() -
          new Date(right.scheduledFor).getTime(),
      )[0] ?? null;

  return {
    overallReadinessPercent,
    completedAutomatically,
    activelyHandling,
    monitoredDeadlines,
    escalatedIssues,
    nextFollowUp: nextPendingReminder
      ? `${nextPendingReminder.requirementName} reminder scheduled for ${formatDateOnly(nextPendingReminder.scheduledFor)}`
      : "No automated follow-ups are currently queued.",
    recentActivity: buildEventRecentActivity({
      documentSubmissions: params.documentSubmissions,
      reminderLogs: params.reminderLogs,
    }),
    criticalRisks: buildEventCriticalRisks({
      eventName: params.eventName,
      eventRequirements: params.eventRequirements,
      fighterRequirements: params.fighterRequirements,
    }),
  };
}

function buildEventRecentActivity(params: {
  documentSubmissions: Awaited<
    ReturnType<typeof documentSubmissionsRepository.listRecentForEvents>
  >;
  reminderLogs: Awaited<ReturnType<typeof reminderLogsRepository.listByEventId>>;
}) {
  const submissionActivity = params.documentSubmissions.slice(0, 4).map((submission) => ({
    id: `submission-${submission.id}`,
    title:
      submission.status === "ACCEPTED"
        ? "Document accepted"
        : submission.status === "REJECTED"
          ? "Document rejected"
          : "Document received",
    detail: submission.originalFileName,
    tone:
      submission.status === "ACCEPTED"
        ? ("success" as const)
        : submission.status === "REJECTED"
          ? ("danger" as const)
          : ("brand" as const),
    occurredAt: submission.createdAt,
  }));
  const reminderActivity = params.reminderLogs
    .filter((reminder) => reminder.status === "SENT")
    .slice(0, 4)
    .map((reminder) => ({
      id: `reminder-${reminder.id}`,
      title: "Reminder sent automatically",
      detail: `${reminder.requirementName} to ${reminder.recipientName}`,
      tone: "success" as const,
      occurredAt: reminder.sentAt ?? reminder.updatedAt,
    }));

  return [...submissionActivity, ...reminderActivity]
    .sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() -
        new Date(left.occurredAt).getTime(),
    )
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.detail,
      tone: item.tone,
    }));
}

function buildEventCriticalRisks(params: {
  eventName: string;
  eventRequirements: EventRequirementRecord[];
  fighterRequirements: FighterRequirementRecord[];
}) {
  const eventRequirementMap = new Map(
    params.eventRequirements.map((requirement) => [requirement.id, requirement]),
  );
  const risks = params.fighterRequirements
    .filter((requirement) =>
      requirement.status === "HUMAN_ACTION" ||
      requirement.status === "NEEDS_RESUBMISSION" ||
      isPastDueRequirement(requirement),
    )
    .slice(0, 5)
    .map((requirement) => {
      const eventRequirement = eventRequirementMap.get(requirement.eventRequirementId);
      const isCritical =
        requirement.status === "HUMAN_ACTION" ||
        requirement.priority === "critical" ||
        isPastDueRequirement(requirement);

      return {
        id: requirement.id,
        label: eventRequirement?.name ?? "Requirement",
        detail:
          requirement.aiReason ??
          requirement.overrideReason ??
          `${params.eventName} requirement needs attention before readiness can close.`,
        tone: isCritical ? ("critical" as const) : ("warning" as const),
      };
    });

  if (risks.length === 0) {
    return [
      {
        id: "no-critical-risks",
        label: "No critical risks",
        detail: "FightOps AI is monitoring deadlines and will escalate only if needed.",
        tone: "warning" as const,
      },
    ];
  }

  return risks;
}

function isPastDueRequirement(requirement: FighterRequirementRecord) {
  return (
    Boolean(requirement.dueDate) &&
    !["ACCEPTED", "NOT_APPLICABLE"].includes(requirement.status) &&
    startOfDayIso(requirement.dueDate ?? CURRENT_LOCAL_DATE) <
      startOfDayIso(CURRENT_LOCAL_DATE)
  );
}

function buildPromoterRequirementGroups(
  requirements: FighterRequirementRecord[],
  eventRequirementMap: Map<string, EventRequirementRecord>,
) {
  const groups = new Map<string, FighterRequirementRecord[]>();

  for (const requirement of requirements) {
    const category =
      eventRequirementMap.get(requirement.eventRequirementId)?.category ??
      "Operations";
    const current = groups.get(category) ?? [];
    current.push(requirement);
    groups.set(category, current);
  }

  return Array.from(groups.entries()).map(([category, groupRequirements]) => {
    const completed = groupRequirements.filter((requirement) =>
      ["ACCEPTED", "NOT_APPLICABLE"].includes(requirement.status),
    ).length;

    return {
      category,
      total: groupRequirements.length,
      completed,
      statusLabel:
        completed === groupRequirements.length
          ? "Complete"
          : `${completed}/${groupRequirements.length} complete`,
    };
  });
}

function buildPromoterFighterTimeline(params: {
  fighterName: string;
  fighterRequirements: FighterRequirementRecord[];
  eventRequirementMap: Map<string, EventRequirementRecord>;
  documentSubmissions: Awaited<
    ReturnType<typeof documentSubmissionsRepository.listByEventAndFighter>
  >;
  reminderHistory: Awaited<
    ReturnType<typeof reminderLogsRepository.listByEventAndFighter>
  >;
}): PromoterEventFighterDetailData["timeline"] {
  const timeline: Array<PromoterEventFighterDetailData["timeline"][number] & {
    occurredAt: string;
  }> = [];

  for (const submission of params.documentSubmissions) {
    const requirement = params.eventRequirementMap.get(
      submission.eventRequirementId,
    );
    timeline.push({
      id: `submission-${submission.id}`,
      title: `${requirement?.name ?? "Document"} uploaded`,
      detail: `${params.fighterName} submitted ${submission.originalFileName}.`,
      timestamp: formatDateTimeLabel(submission.createdAt),
      occurredAt: submission.createdAt,
      tone:
        submission.status === "ACCEPTED"
          ? "success"
          : submission.status === "REJECTED"
            ? "danger"
            : "brand",
    });
  }

  for (const reminder of params.reminderHistory) {
    timeline.push({
      id: `reminder-${reminder.id}`,
      title: `${reminder.requirementName} reminder ${mapReminderStatusLabel(reminder.status).toLowerCase()}`,
      detail: `Email to ${reminder.recipientName} at ${reminder.recipientEmail}.`,
      timestamp: formatDateTimeLabel(reminder.sentAt ?? reminder.scheduledFor),
      occurredAt: reminder.sentAt ?? reminder.scheduledFor,
      tone: reminder.status === "SENT" ? "success" : "warning",
    });
  }

  for (const requirement of params.fighterRequirements) {
    if (requirement.status !== "HUMAN_ACTION") {
      continue;
    }

    const eventRequirement = params.eventRequirementMap.get(
      requirement.eventRequirementId,
    );
    timeline.push({
      id: `human-action-${requirement.id}`,
      title: `${eventRequirement?.name ?? "Requirement"} escalated`,
      detail:
        requirement.aiReason ??
        "FightOps AI needs a human decision before continuing.",
      timestamp: formatDateTimeLabel(requirement.updatedAt),
      occurredAt: requirement.updatedAt,
      tone: "danger",
    });
  }

  return timeline
    .sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
    )
    .slice(0, 12)
    .map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.detail,
      timestamp: item.timestamp,
      tone: item.tone,
    }));
}

function buildFightInsightWaitingFor(
  eventRequirements: EventRequirementRecord[],
  leftRequirements: FighterRequirementRecord[],
  rightRequirements: FighterRequirementRecord[],
) {
  const requirementMap = new Map(eventRequirements.map((item) => [item.id, item]));
  const unresolved = [...leftRequirements, ...rightRequirements]
    .filter((item) => ["WAITING", "NEEDS_RESUBMISSION", "HUMAN_ACTION"].includes(item.status))
    .map((item) => {
      const requirement = requirementMap.get(item.eventRequirementId);
      return {
        label: requirement?.name ?? "Requirement",
        tone: item.priority === "critical" ? "critical" : "high",
      } as const;
    });

  return unresolved.slice(0, 3);
}

function buildFightInsightNextAction(
  eventRequirements: EventRequirementRecord[],
  leftRequirements: FighterRequirementRecord[],
  rightRequirements: FighterRequirementRecord[],
) {
  const requirementMap = new Map(eventRequirements.map((item) => [item.id, item]));
  const nextRequirement = [...leftRequirements, ...rightRequirements].find((item) =>
    ["WAITING", "NEEDS_RESUBMISSION", "HUMAN_ACTION"].includes(item.status),
  );

  if (!nextRequirement) {
    return "No immediate actions pending on this fight.";
  }

  const requirement = requirementMap.get(nextRequirement.eventRequirementId);

  if (nextRequirement.status === "HUMAN_ACTION") {
    return `Review ${requirement?.name ?? "the requirement"} and resolve the flagged issue.`;
  }

  if (nextRequirement.status === "NEEDS_RESUBMISSION") {
    return `Request a fresh upload for ${requirement?.name ?? "the requirement"}.`;
  }

  return `Awaiting submission for ${requirement?.name ?? "the next requirement"}.`;
}

function buildPromoterFighterOverview(params: {
  sideLabel: string;
  fighterId: string | null;
  fighter:
    | {
        fullName: string;
        nationality: string | null;
        stance: string | null;
        division: string | null;
        managerName: string | null;
        managerEmail: string | null;
        contractReference?: string | null;
        managerPhone?: string | null;
        inviteStatus?: "pending" | "accepted";
        inviteAcceptedAt?: string | null;
      }
    | null
    | undefined;
  signedAgreementRequirement: EventRequirementRecord | null;
  requirement: FighterRequirementRecord | null;
}) {
  const contractStatusLabel = mapContractStatusLabel(params.requirement?.status ?? "WAITING");
  const contractDueDateLabel = params.signedAgreementRequirement?.dueDate
    ? formatDateOnly(params.signedAgreementRequirement.dueDate)
    : "No due date";
  const isContractOverdue =
    Boolean(params.signedAgreementRequirement?.dueDate) &&
    !["ACCEPTED", "NOT_APPLICABLE"].includes(params.requirement?.status ?? "WAITING") &&
    startOfDayIso(params.signedAgreementRequirement?.dueDate ?? CURRENT_LOCAL_DATE) <
      startOfDayIso(CURRENT_LOCAL_DATE);
  const actions: Array<"reinvite" | "replace"> =
    params.fighter?.inviteStatus === "accepted" && !isContractOverdue
      ? ["replace"]
      : ["reinvite", "replace"];

  return {
    fighterId: params.fighterId,
    sideLabel: params.sideLabel,
    fighterName: params.fighter?.fullName ?? "TBD Fighter",
    division: params.fighter?.division ?? "TBD",
    contactName: params.fighter?.managerName ?? "Not assigned",
    contactEmail: params.fighter?.managerEmail ?? "Not assigned",
    contactPhone: params.fighter?.managerPhone ?? "Not provided",
    contractReference: params.fighter?.contractReference ?? "",
    inviteStatusLabel: params.fighter
      ? params.fighter.inviteStatus === "accepted"
        ? "Accepted"
        : "Pending"
      : "Pending",
    inviteAcceptedAtLabel: params.fighter?.inviteAcceptedAt
      ? formatDateTimeLabel(params.fighter.inviteAcceptedAt)
      : "Not accepted yet",
    contractStatusLabel,
    contractDueDateLabel,
    isContractOverdue,
    recommendedAction: buildPromoterFighterRecommendation({
      inviteStatus: params.fighter?.inviteStatus ?? "pending",
      contractStatus: params.requirement?.status ?? "WAITING",
      isContractOverdue,
      requirementName: params.signedAgreementRequirement?.name ?? "Signed agreement",
    }),
    actions,
  };
}

function buildPromoterFighterRecommendation(params: {
  inviteStatus: "pending" | "accepted";
  contractStatus: FighterRequirementStatus;
  isContractOverdue: boolean;
  requirementName: string;
}) {
  if (params.inviteStatus === "pending") {
    return `Invite has not been accepted yet. Re-invite this contact or replace the fighter assignment.`;
  }

  if (params.isContractOverdue) {
    return `${params.requirementName} is past due. Follow up now or replace this fighter on the card.`;
  }

  if (params.contractStatus === "NEEDS_RESUBMISSION") {
    return `${params.requirementName} needs a fresh upload before approval can continue.`;
  }

  if (params.contractStatus === "HUMAN_ACTION") {
    return `${params.requirementName} is waiting on a manual decision from operations.`;
  }

  if (params.contractStatus === "ACCEPTED" || params.contractStatus === "NOT_APPLICABLE") {
    return `${params.requirementName} is approved. Continue with the remaining requirements.`;
  }

  return `Waiting for ${params.requirementName} before the next readiness steps can move forward.`;
}

function mapContractStatusLabel(status: FighterRequirementStatus) {
  if (status === "ACCEPTED" || status === "NOT_APPLICABLE") {
    return "Approved";
  }

  if (status === "RECEIVED" || status === "PROCESSING") {
    return "Under review";
  }

  if (status === "NEEDS_RESUBMISSION") {
    return "Needs resubmission";
  }

  if (status === "HUMAN_ACTION") {
    return "Human review";
  }

  return "Awaiting signature";
}

function formatPromoterPositionLabel(order: number) {
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

function startOfDayIso(isoDate: string) {
  const date = new Date(isoDate);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function resolveEventStatus(date: string): NonNullable<CreateEventInput["status"]> {
  const today = new Date();
  const todayTime = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const eventTime = startOfDayIso(date);

  if (eventTime < todayTime) {
    return "completed";
  }

  if (eventTime === todayTime) {
    return "active";
  }

  return "upcoming";
}
