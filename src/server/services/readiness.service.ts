import type {
  FighterRequirementRecord,
  FighterReadinessDetail,
  ReadinessStatus,
} from "@/types/readiness";
import { fighterReadinessRepository } from "@/server/repositories/fighter-readiness.repository";
import { fighterRequirementsRepository } from "@/server/repositories/fighter-requirements.repository";
import { fightersRepository } from "@/server/repositories/fighters.repository";

export async function recalculateFighterReadiness(params: {
  eventId: string;
  fighterId: string;
}) {
  const requirements = await fighterRequirementsRepository.listByEventAndFighter(
    params.eventId,
    params.fighterId,
  );

  const links = await fightersRepository.listEventFighterLinks(params.eventId);
  const link =
    links.find((entry) => entry.fighterId === params.fighterId) ?? null;

  const readinessPercentage = calculateReadinessPercentage(requirements);
  const status = calculateReadinessStatus(requirements);
  const nextAction = deriveNextAction(requirements);

  return fighterReadinessRepository.upsert({
    eventId: params.eventId,
    fighterId: params.fighterId,
    fightId: link?.fightId ?? null,
    opponentFighterId: link?.opponentFighterId ?? null,
    readinessPercentage,
    status,
    nextAction,
  });
}

export async function getFighterReadinessDetail(params: {
  eventId: string;
  fighterId: string;
}): Promise<FighterReadinessDetail | null> {
  const readiness = await fighterReadinessRepository.findByEventAndFighter(
    params.eventId,
    params.fighterId,
  );

  if (!readiness) {
    return null;
  }

  const requirements = await fighterRequirementsRepository.listByEventAndFighter(
    params.eventId,
    params.fighterId,
  );

  return {
    readiness,
    requirements,
  };
}

export function calculateReadinessStatus(
  requirements: FighterRequirementRecord[],
): ReadinessStatus {
  const mandatory = requirements.filter((requirement) => requirement.required);

  const hasHumanAction = mandatory.some(
    (requirement) => requirement.status === "HUMAN_ACTION",
  );

  if (hasHumanAction) {
    return "HUMAN_ACTION";
  }

  const hasProcessing = mandatory.some(
    (requirement) =>
      requirement.status === "PROCESSING" || requirement.status === "RECEIVED",
  );

  const unresolved = mandatory.filter(
    (requirement) =>
      !["ACCEPTED", "NOT_APPLICABLE"].includes(requirement.status),
  );

  if (unresolved.length === 0) {
    return "READY";
  }

  if (hasProcessing) {
    return "PROCESSING";
  }

  return "WAITING";
}

export function calculateReadinessPercentage(
  requirements: FighterRequirementRecord[],
) {
  const mandatory = requirements.filter((requirement) => requirement.required);

  if (mandatory.length === 0) {
    return 100;
  }

  const resolved = mandatory.filter((requirement) =>
    ["ACCEPTED", "NOT_APPLICABLE"].includes(requirement.status),
  );

  return Math.round((resolved.length / mandatory.length) * 100);
}

function deriveNextAction(requirements: FighterRequirementRecord[]) {
  const blockingRequirement = requirements
    .filter((requirement) => requirement.required)
    .find((requirement) => !["ACCEPTED", "NOT_APPLICABLE"].includes(requirement.status));

  if (!blockingRequirement) {
    return "All mandatory requirements resolved.";
  }

  if (blockingRequirement.status === "HUMAN_ACTION") {
    return "Manual review required on a blocking requirement.";
  }

  if (blockingRequirement.status === "NEEDS_RESUBMISSION") {
    return "A blocking requirement needs resubmission.";
  }

  return "A mandatory requirement is still waiting for completion.";
}
