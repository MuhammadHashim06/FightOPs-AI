import { documentSubmissionsRepository } from "@/server/repositories/document-submissions.repository";
import { eventRequirementsRepository } from "@/server/repositories/event-requirements.repository";
import { eventsRepository } from "@/server/repositories/events.repository";
import { fighterRequirementsRepository } from "@/server/repositories/fighter-requirements.repository";
import { fightersRepository } from "@/server/repositories/fighters.repository";
import { getFightById } from "@/server/repositories/fights.repository";
import { uploadObject } from "@/server/services/storage.service";
import { buildDueDateByRequirementId } from "@/server/services/requirement-schedule.service";
import { getEventById } from "@/server/services/events.service";
import { syncEventReminderQueue } from "@/server/services/reminders.service";
import { recalculateFighterReadiness } from "@/server/services/readiness.service";
import type { AuthUser } from "@/types/auth";
import type { EventRecord, FighterRecord } from "@/types/event";
import type { EventRequirementRecord } from "@/types/readiness";
import type { DocumentSubmissionStatus } from "@/types/readiness";

const maxUploadBytes = 15 * 1024 * 1024;

export type DocumentReviewQueueItem = {
  id: string;
  eventId: string;
  eventName: string;
  fighterId: string;
  fighterName: string;
  fightId: string | null;
  requirementName: string;
  category: string;
  priority: EventRequirementRecord["priority"];
  fileName: string;
  fileSizeLabel: string;
  uploadedAtLabel: string;
  uploadedAt: string;
  status: DocumentSubmissionStatus;
  statusLabel: string;
  reviewNote: string | null;
  publicUrl: string | null;
};

export async function uploadFighterRequirementDocument(params: {
  user: AuthUser;
  fighterRequirementId: string;
  file: File;
}) {
  if (params.user.role !== "fighter") {
    throw new Error("Only fighters can upload requirement documents.");
  }

  if (params.file.size <= 0) {
    throw new Error("Please select a file to upload.");
  }

  if (params.file.size > maxUploadBytes) {
    throw new Error("Document file must be 15 MB or smaller.");
  }

  const requirement = await fighterRequirementsRepository.findById(
    params.fighterRequirementId,
  );

  if (!requirement) {
    throw new Error("Requirement was not found.");
  }

  const fighter = await fightersRepository.findFighterById(requirement.fighterId);

  if (!fighter) {
    throw new Error("Fighter was not found.");
  }

  const ownsFighter =
    fighter.userId === params.user.id ||
    fighter.managerEmail?.toLowerCase() === params.user.email.toLowerCase();

  if (!ownsFighter) {
    throw new Error("You cannot upload documents for this fighter.");
  }

  const eventRequirements = await eventRequirementsRepository.listByEventId(
    requirement.eventId,
  );
  const eventRequirement = eventRequirements.find(
    (item) => item.id === requirement.eventRequirementId,
  );

  if (!eventRequirement || eventRequirement.inputType !== "document") {
    throw new Error("This requirement does not accept document uploads.");
  }

  validateAcceptedFileType(params.file, eventRequirement.acceptedFileTypes);

  const buffer = Buffer.from(await params.file.arrayBuffer());
  const upload = await uploadObject({
    buffer,
    fileName: params.file.name,
    mimeType: params.file.type || "application/octet-stream",
    scope: `events/${requirement.eventId}/fighters/${requirement.fighterId}/requirements/${requirement.eventRequirementId}`,
  });
  const needsHumanReview =
    requirement.humanVerificationRequired || eventRequirement.humanVerificationRequired;

  const submission = await documentSubmissionsRepository.create({
    eventId: requirement.eventId,
    fighterId: requirement.fighterId,
    fightId: requirement.fightId,
    eventRequirementId: requirement.eventRequirementId,
    fighterRequirementId: requirement.id,
    uploadedByUserId: params.user.id,
    originalFileName: params.file.name,
    mimeType: params.file.type || "application/octet-stream",
    sizeBytes: params.file.size,
    storageProvider: upload.provider,
    storageKey: upload.key,
    publicUrl: upload.publicUrl,
    status: "PENDING_REVIEW",
    reviewNote: null,
    reviewedByUserId: null,
    reviewedAt: null,
  });

  await fighterRequirementsRepository.updateStatus({
    fighterRequirementId: requirement.id,
    status: needsHumanReview ? "RECEIVED" : "PROCESSING",
    latestSubmissionId: submission.id,
  });
  await recalculateFighterReadiness({
    eventId: requirement.eventId,
    fighterId: requirement.fighterId,
  });
  await syncEventReminderQueue(requirement.eventId);

  return submission;
}

export async function listDocumentReviewQueue(user: AuthUser) {
  if (user.role !== "admin" && user.role !== "promoter") {
    throw new Error("Only admins or promoters can access document review.");
  }

  const allEvents = await eventsRepository.listEvents();
  const visibleEvents =
    user.role === "admin"
      ? allEvents
      : allEvents.filter((event) => event.createdByUserId === user.id);

  const submissions =
    user.role === "admin"
      ? await documentSubmissionsRepository.listAllRecent()
      : await documentSubmissionsRepository.listRecentForEvents(
          visibleEvents.map((event) => event.id),
        );

  const eventsById = new Map(visibleEvents.map((event) => [event.id, event]));
  const fighterIds = Array.from(new Set(submissions.map((item) => item.fighterId)));
  const fighters = await fightersRepository.listFightersByIds(fighterIds);
  const fightersById = new Map(fighters.map((fighter) => [fighter.id, fighter]));
  const requirementsByEventId = new Map<string, EventRequirementRecord[]>();

  for (const event of visibleEvents) {
    requirementsByEventId.set(
      event.id,
      await eventRequirementsRepository.listByEventId(event.id),
    );
  }

  return submissions
    .filter((submission) => eventsById.has(submission.eventId))
    .map((submission) =>
      mapReviewQueueItem({
        submission,
        event: eventsById.get(submission.eventId) ?? null,
        fighter: fightersById.get(submission.fighterId) ?? null,
        requirement:
          requirementsByEventId
            .get(submission.eventId)
            ?.find((item) => item.id === submission.eventRequirementId) ?? null,
      }),
    );
}

export async function reviewDocumentSubmission(params: {
  user: AuthUser;
  submissionId: string;
  decision: "accept" | "reject";
  note?: string | null;
}) {
  if (params.user.role !== "admin" && params.user.role !== "promoter") {
    throw new Error("Only admins or promoters can review document submissions.");
  }

  const submission = await documentSubmissionsRepository.findById(params.submissionId);

  if (!submission) {
    throw new Error("Document submission was not found.");
  }

  if (params.user.role === "promoter") {
    const event = await eventsRepository.findEventById(submission.eventId);

    if (!event || event.createdByUserId !== params.user.id) {
      throw new Error("You cannot review documents for this event.");
    }
  }

  const now = new Date().toISOString();
  const eventRequirements = await eventRequirementsRepository.listByEventId(
    submission.eventId,
  );
  const eventRequirement = eventRequirements.find(
    (item) => item.id === submission.eventRequirementId,
  );
  const status: DocumentSubmissionStatus =
    params.decision === "accept" ? "ACCEPTED" : "REJECTED";
  const reviewedSubmission = await documentSubmissionsRepository.updateReviewStatus({
    submissionId: params.submissionId,
    status,
    reviewNote: params.note,
    reviewedByUserId: params.user.id,
    reviewedAt: now,
  });

  await fighterRequirementsRepository.updateStatus({
    fighterRequirementId: submission.fighterRequirementId,
    status: params.decision === "accept" ? "ACCEPTED" : "NEEDS_RESUBMISSION",
    overrideReason: params.decision === "reject" ? params.note ?? "Rejected by reviewer." : null,
    latestSubmissionId: submission.id,
  });

  if (params.decision === "accept" && eventRequirement?.isSignedAgreement) {
    const [event, fight, fighter] = await Promise.all([
      getEventById(submission.eventId),
      submission.fightId ? getFightById(submission.fightId) : Promise.resolve(null),
      fightersRepository.findFighterById(submission.fighterId),
    ]);

    if (event && fight && fighter) {
      await fighterRequirementsRepository.updateDueDatesForFighter({
        eventId: submission.eventId,
        fighterId: submission.fighterId,
        dueDateByRequirementId: buildDueDateByRequirementId({
          event,
          fight,
          fighter,
          signedAgreementApprovedAt: now,
          eventRequirements,
        }),
      });
    }
  }

  await recalculateFighterReadiness({
    eventId: submission.eventId,
    fighterId: submission.fighterId,
  });
  await syncEventReminderQueue(submission.eventId);

  return reviewedSubmission;
}

function mapReviewQueueItem(params: {
  submission: Awaited<ReturnType<typeof documentSubmissionsRepository.listAllRecent>>[number];
  event: EventRecord | null;
  fighter: FighterRecord | null;
  requirement: EventRequirementRecord | null;
}): DocumentReviewQueueItem {
  return {
    id: params.submission.id,
    eventId: params.submission.eventId,
    eventName: params.event?.name ?? "Unknown event",
    fighterId: params.submission.fighterId,
    fighterName: params.fighter?.fullName ?? "Unknown fighter",
    fightId: params.submission.fightId,
    requirementName: params.requirement?.name ?? "Requirement",
    category: params.requirement?.category ?? "Documents",
    priority: params.requirement?.priority ?? "medium",
    fileName: params.submission.originalFileName,
    fileSizeLabel: formatBytes(params.submission.sizeBytes),
    uploadedAtLabel: formatDateTimeLabel(params.submission.createdAt),
    uploadedAt: params.submission.createdAt,
    status: params.submission.status,
    statusLabel: mapSubmissionStatusLabel(params.submission.status),
    reviewNote: params.submission.reviewNote,
    publicUrl: params.submission.publicUrl,
  };
}

function mapSubmissionStatusLabel(status: DocumentSubmissionStatus) {
  if (status === "ACCEPTED") {
    return "Accepted";
  }

  if (status === "REJECTED") {
    return "Rejected";
  }

  return "Pending review";
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTimeLabel(isoDate: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

function validateAcceptedFileType(file: File, acceptedFileTypes: string[]) {
  if (acceptedFileTypes.length === 0) {
    return;
  }

  const fileExtension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const normalizedTypes = acceptedFileTypes.map((item) =>
    item.replace(/^\./, "").toLowerCase(),
  );

  if (!normalizedTypes.includes(fileExtension)) {
    throw new Error(`Allowed file types: ${normalizedTypes.join(", ")}.`);
  }
}
