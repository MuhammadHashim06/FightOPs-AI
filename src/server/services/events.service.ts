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
  status: "draft" | "upcoming" | "active";
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

const defaultTabs = [
  "Fight Card",
  "Required Documents",
  "Human Action",
  "Post Reminders",
  "Event Knowledge",
  "Communications",
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

  const event = await eventsRepository.createEvent({
    ...input,
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

  return eventsRepository.updateEvent(eventId, {
    ...input,
    slug,
  });
}

export async function deleteEvent(eventId: string) {
  return eventsRepository.deleteEvent(eventId);
}

export async function listPromoterDashboardEvents(): Promise<DashboardEventSummary[]> {
  const events = await eventsRepository.listEvents();

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
        status: event.status === "completed" ? "active" : event.status,
        waitingItems: 0,
        humanActionItems: 0,
      };
    }),
  );
}

export async function getPromoterOverviewStats(): Promise<DashboardOverviewStats> {
  const events = await listPromoterDashboardEvents();
  const totalEvents = events.length;
  const totalFights = events.reduce((sum, event) => sum + event.fights, 0);
  const totalFighters = events.reduce((sum, event) => sum + event.fighters, 0);

  return [
    { label: "Events", value: String(totalEvents), hint: "across promotion" },
    { label: "Fights", value: String(totalFights), hint: "on the card" },
    { label: "Fighters", value: String(totalFighters), hint: "assigned to events" },
    { label: "Waiting", value: "0", hint: "awaiting items", tone: "warning" },
    {
      label: "Human Action",
      value: "0",
      hint: "cases need review",
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
  const fighters = await fightersRepository.listFightersByIds(fighterIds);
  const readinessItems = await fighterReadinessRepository.listByEventId(event.id);

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
