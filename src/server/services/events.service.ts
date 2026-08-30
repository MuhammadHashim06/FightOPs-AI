import type { CreateEventInput, UpdateEventInput } from "@/types/event";
import { eventsRepository } from "@/server/repositories/events.repository";
import { fightersRepository } from "@/server/repositories/fighters.repository";
import { fighterReadinessRepository } from "@/server/repositories/fighter-readiness.repository";
import { getFightsByEventId } from "@/server/repositories/fights.repository";
import { applyRequirementTemplatesToEvent } from "@/server/services/requirement-templates.service";
import {
  validateCreateEventInput,
  validateUpdateEventInput,
} from "@/server/validators/events.validator";

type DashboardEventSummary = {
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

type DashboardOverviewStats = Array<{
  label: string;
  value: string;
  hint: string;
  tone?: "warning" | "highlight";
}>;

type DashboardEventDetail = DashboardEventSummary & {
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

const defaultTabs = [
  "Fight Card",
  "Required Documents",
  "Human Action",
  "Post Reminders",
  "Event Knowledge",
  "Communications",
];

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
