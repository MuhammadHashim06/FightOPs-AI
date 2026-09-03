import { auditLogsRepository } from "@/server/repositories/audit-logs.repository";
import { authRepository } from "@/server/repositories/auth.repository";
import { eventRequirementsRepository } from "@/server/repositories/event-requirements.repository";
import { eventsRepository } from "@/server/repositories/events.repository";
import { fightersRepository } from "@/server/repositories/fighters.repository";
import { canAccessEvent } from "@/server/security/authorization";
import type { AuthUser } from "@/types/auth";
import type { ActivityLogEntry } from "@/types/activity";

export async function listActivityLogEntries(user: AuthUser): Promise<ActivityLogEntry[]> {
  if (user.role !== "admin" && user.role !== "promoter") {
    return [];
  }

  const events = (await eventsRepository.listEvents()).filter((event) =>
    canAccessEvent(user, event),
  );
  const logs = await auditLogsRepository.listByEventIdsOrActor(
    events.map((event) => event.id),
    user.id,
  );
  const actorIds = Array.from(new Set(logs.map((log) => log.actorUserId)));
  const actors = await Promise.all(
    actorIds.map(async (actorId) => [actorId, await authRepository.findUserById(actorId)] as const),
  );
  const actorMap = new Map(actors);
  const eventMap = new Map(events.map((event) => [event.id, event]));
  const fighterIds = Array.from(
    new Set(logs.flatMap((log) => (log.fighterId ? [log.fighterId] : []))),
  );
  const fighters = await fightersRepository.listFightersByIds(fighterIds);
  const fighterMap = new Map(fighters.map((fighter) => [fighter.id, fighter]));

  const requirementMaps = await Promise.all(
    events.map(async (event) => [
      event.id,
      new Map(
        (await eventRequirementsRepository.listByEventId(event.id)).map((requirement) => [
          requirement.id,
          requirement.name,
        ]),
      ),
    ] as const),
  );
  const requirementMapByEvent = new Map(requirementMaps);

  return logs.map((log) => {
    const event = eventMap.get(log.eventId);
    const fighter = log.fighterId ? fighterMap.get(log.fighterId) : null;
    const requirement = log.requirementId
      ? requirementMapByEvent.get(log.eventId)?.get(log.requirementId)
      : null;
    const actor = actorMap.get(log.actorUserId);

    return {
      id: log.id,
      timestamp: formatTimestamp(log.createdAt),
      actorLabel: actor?.profile.displayName ?? "System",
      actorType: actor?.role ?? "admin",
      fighterName: fighter?.fullName ?? requirement ?? "Workspace",
      actionTitle: formatActionTitle(log.action),
      actionDescription:
        log.note ?? `${event?.name ?? "Event"} requirement action was recorded.`,
      stateChange: `${formatState(log.stateFrom)} -> ${formatState(log.stateTo)}`,
      confidence: "-",
    };
  });
}

function formatActionTitle(action: string) {
  return action
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatState(state: string) {
  return state
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatTimestamp(value: string) {
  return new Date(value).toISOString().slice(0, 16).replace("T", " ");
}
