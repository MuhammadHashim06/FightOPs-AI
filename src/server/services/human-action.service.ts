import { auditLogsRepository } from "@/server/repositories/audit-logs.repository";
import { documentSubmissionsRepository } from "@/server/repositories/document-submissions.repository";
import { eventRequirementsRepository } from "@/server/repositories/event-requirements.repository";
import { eventsRepository } from "@/server/repositories/events.repository";
import { fighterRequirementsRepository } from "@/server/repositories/fighter-requirements.repository";
import { fightersRepository } from "@/server/repositories/fighters.repository";
import { canAccessEvent } from "@/server/security/authorization";
import { getEventById } from "@/server/services/events.service";
import { recalculateFighterReadiness } from "@/server/services/readiness.service";
import { refreshRequirementReminderSchedule } from "@/server/services/reminders.service";
import type { AuthUser } from "@/types/auth";
import type {
  HumanActionCaseDetail,
  HumanActionCaseSummary,
  HumanActionDecision,
} from "@/types/human-action";
import type { FighterRequirementRecord } from "@/types/readiness";

export async function listHumanActionCases(user: AuthUser) {
  if (user.role !== "admin" && user.role !== "promoter") {
    return [] satisfies HumanActionCaseSummary[];
  }

  const events = await eventsRepository.listEvents();
  const visibleEvents = events.filter((event) => canAccessEvent(user, event));
  const cases: HumanActionCaseSummary[] = [];

  for (const event of visibleEvents) {
    const eventRequirements = await eventRequirementsRepository.listByEventId(event.id);
    const requirementMap = new Map(eventRequirements.map((item) => [item.id, item]));
    const fighterRequirements = await fighterRequirementsRepository.listByEventId(event.id);
    const fighterIds = Array.from(
      new Set(
        fighterRequirements
          .filter((item) => item.status === "HUMAN_ACTION")
          .map((item) => item.fighterId),
      ),
    );
    const fighters = await fightersRepository.listFightersByIds(fighterIds);
    const fighterMap = new Map(fighters.map((fighter) => [fighter.id, fighter]));

    for (const requirement of fighterRequirements.filter(
      (item) => item.status === "HUMAN_ACTION",
    )) {
      const eventRequirement = requirementMap.get(requirement.eventRequirementId);
      const fighter = fighterMap.get(requirement.fighterId);

      cases.push({
        id: requirement.id,
        eventSlug: event.slug,
        eventName: event.name,
        fighterName: fighter?.fullName ?? "Unknown fighter",
        reason:
          requirement.aiReason ??
          requirement.overrideReason ??
          "AI could not safely verify this requirement.",
        requirement: eventRequirement?.name ?? "Requirement",
        priority: requirement.priority,
        confidence: formatConfidence(requirement.aiConfidence),
        status: "open",
      });
    }
  }

  return cases.sort((left, right) => priorityRank(left.priority) - priorityRank(right.priority));
}

export async function getHumanActionCaseByIdForUser(
  requirementId: string,
  user: AuthUser,
): Promise<HumanActionCaseDetail | null> {
  const requirement = await fighterRequirementsRepository.findById(requirementId);

  if (!requirement || requirement.status !== "HUMAN_ACTION") {
    return null;
  }

  const event = await getEventById(requirement.eventId);

  if (!event || !canAccessEvent(user, event)) {
    return null;
  }

  const [eventRequirements, fighter, submissions] = await Promise.all([
    eventRequirementsRepository.listByEventId(event.id),
    fightersRepository.findFighterById(requirement.fighterId),
    documentSubmissionsRepository.listByEventAndFighter(event.id, requirement.fighterId),
  ]);
  const eventRequirement = eventRequirements.find(
    (item) => item.id === requirement.eventRequirementId,
  );
  const submission = submissions.find(
    (item) => item.id === requirement.latestSubmissionId,
  );
  const reason =
    requirement.aiReason ??
    requirement.overrideReason ??
    "AI could not safely verify this requirement.";
  const fighterName = fighter?.fullName ?? "Unknown fighter";

  return {
    id: requirement.id,
    eventSlug: event.slug,
    eventName: event.name,
    fighterName,
    reason,
    requirement: eventRequirement?.name ?? "Requirement",
    priority: requirement.priority,
    confidence: formatConfidence(requirement.aiConfidence),
    status: "open",
    eventId: event.id,
    fighterId: requirement.fighterId,
    requirementId: requirement.id,
    createdAt: formatDateTime(requirement.updatedAt),
    summary: `${eventRequirement?.name ?? "This requirement"} needs a human decision before readiness can continue.`,
    confidenceScore: formatConfidence(requirement.aiConfidence),
    documentName: submission?.originalFileName ?? "No document attached",
    documentMeta: submission
      ? `${submission.mimeType} - ${formatBytes(submission.sizeBytes)}`
      : "No submission",
    documentSubmissionId: submission?.id ?? null,
    aiExtracted: [{ label: "AI reason", value: reason }],
    existingRecord: [
      { label: "Fighter", value: fighterName },
      { label: "Requirement", value: eventRequirement?.name ?? "Requirement" },
      { label: "Current status", value: requirement.status },
    ],
    mismatch: reason,
    recommendation:
      "Review the submitted information and choose the appropriate action before clearing this case.",
  };
}

export async function resolveHumanActionCase(params: {
  user: AuthUser;
  requirementId: string;
  decision: HumanActionDecision;
  note?: string | null;
  correctValue?: string | null;
}) {
  if (params.user.role !== "admin" && params.user.role !== "promoter") {
    throw new Error("Only admins or promoters can resolve human action cases.");
  }

  const requirement = await fighterRequirementsRepository.findById(params.requirementId);

  if (!requirement || requirement.status !== "HUMAN_ACTION") {
    throw new Error("Human action case was not found or is already resolved.");
  }

  const event = await getEventById(requirement.eventId);

  if (!event || !canAccessEvent(params.user, event)) {
    throw new Error("You cannot resolve this case.");
  }

  const submissions = await documentSubmissionsRepository.listByEventAndFighter(
    requirement.eventId,
    requirement.fighterId,
  );
  const latestSubmission = submissions.find(
    (item) => item.id === requirement.latestSubmissionId,
  );
  const isAccepting =
    params.decision === "approve_extracted" || params.decision === "correct_and_accept";
  if (params.decision === "approve_extracted" && !latestSubmission) {
    throw new Error("A document must be attached before approving the extracted value.");
  }
  const isNotApplicable = params.decision === "mark_not_applicable";
  const nextStatus: FighterRequirementRecord["status"] = isAccepting
    ? "ACCEPTED"
    : isNotApplicable
      ? "NOT_APPLICABLE"
      : params.decision === "contact_participant"
        ? "HUMAN_ACTION"
        : "NEEDS_RESUBMISSION";
  const note = params.correctValue?.trim()
    ? `Corrected value: ${params.correctValue.trim()}`
    : params.note?.trim() || null;

  if (latestSubmission && isAccepting) {
    await documentSubmissionsRepository.updateReviewStatus({
      submissionId: latestSubmission.id,
      status: "ACCEPTED",
      reviewNote: note,
      reviewedByUserId: params.user.id,
      reviewedAt: new Date().toISOString(),
    });
  } else if (latestSubmission && nextStatus === "NEEDS_RESUBMISSION") {
    await documentSubmissionsRepository.updateReviewStatus({
      submissionId: latestSubmission.id,
      status: "REJECTED",
      reviewNote: note ?? "Please submit a new document.",
      reviewedByUserId: params.user.id,
      reviewedAt: new Date().toISOString(),
    });
  }

  await fighterRequirementsRepository.updateStatus({
    fighterRequirementId: requirement.id,
    status: nextStatus,
    overrideReason: note,
    latestSubmissionId: requirement.latestSubmissionId,
  });
  await auditLogsRepository.create({
    eventId: requirement.eventId,
    fighterId: requirement.fighterId,
    fightId: requirement.fightId,
    requirementId: requirement.id,
    actorUserId: params.user.id,
    action: params.decision,
    stateFrom: requirement.status,
    stateTo: nextStatus,
    note,
  });
  await recalculateFighterReadiness({
    eventId: requirement.eventId,
    fighterId: requirement.fighterId,
  });
  await refreshRequirementReminderSchedule(requirement.id);

  return { requirementId: requirement.id, status: nextStatus };
}

function priorityRank(priority: HumanActionCaseSummary["priority"]) {
  return { critical: 0, high: 1, medium: 2, low: 3 }[priority];
}

function formatConfidence(value: number | null) {
  return value === null ? "Not available" : `${value}% confidence`;
}

function formatDateTime(value: string) {
  return new Date(value).toISOString().slice(0, 16).replace("T", " ");
}

function formatBytes(value: number) {
  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
