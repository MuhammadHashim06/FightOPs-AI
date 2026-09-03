import type {
  DocumentSubmissionRecord,
  DocumentSubmissionStatus,
} from "@/types/readiness";
import { connectToDatabase } from "@/server/db/mongoose";
import { DocumentSubmissionMongoModel } from "@/server/models/document-submission.model";

export const documentSubmissionsRepository = {
  async create(input: Omit<DocumentSubmissionRecord, "id" | "createdAt" | "updatedAt">) {
    await connectToDatabase();

    const submission = await DocumentSubmissionMongoModel.create({
      eventId: input.eventId,
      fighterId: input.fighterId,
      fightId: input.fightId,
      eventRequirementId: input.eventRequirementId,
      fighterRequirementId: input.fighterRequirementId,
      uploadedByUserId: input.uploadedByUserId,
      originalFileName: input.originalFileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      storageProvider: input.storageProvider,
      storageKey: input.storageKey,
      publicUrl: input.publicUrl,
      status: input.status,
      reviewNote: input.reviewNote,
      reviewedByUserId: input.reviewedByUserId,
      reviewedAt: input.reviewedAt,
    });

    return mapSubmission(submission.toObject());
  },
  async findById(submissionId: string) {
    await connectToDatabase();

    const submission = await DocumentSubmissionMongoModel.findById(submissionId).lean();
    return submission ? mapSubmission(submission) : null;
  },
  async listByEventAndFighter(eventId: string, fighterId: string) {
    await connectToDatabase();

    const submissions = await DocumentSubmissionMongoModel.find({
      eventId,
      fighterId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return submissions.map(mapSubmission);
  },
  async listRecentForEvents(eventIds: string[]) {
    await connectToDatabase();

    if (eventIds.length === 0) {
      return [];
    }

    const submissions = await DocumentSubmissionMongoModel.find({
      eventId: { $in: eventIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    return submissions.map(mapSubmission);
  },
  async listAllRecent() {
    await connectToDatabase();

    const submissions = await DocumentSubmissionMongoModel.find()
      .sort({ createdAt: -1 })
      .lean();

    return submissions.map(mapSubmission);
  },
  async deleteByEventId(eventId: string) {
    await connectToDatabase();

    const result = await DocumentSubmissionMongoModel.deleteMany({ eventId });
    return result.deletedCount ?? 0;
  },
  async updateReviewStatus(params: {
    submissionId: string;
    status: DocumentSubmissionStatus;
    reviewNote?: string | null;
    reviewedByUserId: string;
    reviewedAt: string;
  }) {
    await connectToDatabase();

    const submission = await DocumentSubmissionMongoModel.findByIdAndUpdate(
      params.submissionId,
      {
        status: params.status,
        reviewNote: normalizeOptionalText(params.reviewNote ?? undefined),
        reviewedByUserId: params.reviewedByUserId,
        reviewedAt: new Date(params.reviewedAt),
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    ).lean();

    return submission ? mapSubmission(submission) : null;
  },
};

function mapSubmission(submission: {
  _id: { toString(): string };
  eventId: { toString(): string };
  fighterId: { toString(): string };
  fightId: { toString(): string } | null;
  eventRequirementId: { toString(): string };
  fighterRequirementId: { toString(): string };
  uploadedByUserId: { toString(): string };
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  storageProvider: "local" | "r2";
  storageKey: string;
  publicUrl: string | null;
  status: DocumentSubmissionStatus;
  reviewNote: string | null;
  reviewedByUserId: { toString(): string } | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): DocumentSubmissionRecord {
  return {
    id: submission._id.toString(),
    eventId: submission.eventId.toString(),
    fighterId: submission.fighterId.toString(),
    fightId: submission.fightId ? submission.fightId.toString() : null,
    eventRequirementId: submission.eventRequirementId.toString(),
    fighterRequirementId: submission.fighterRequirementId.toString(),
    uploadedByUserId: submission.uploadedByUserId.toString(),
    originalFileName: submission.originalFileName,
    mimeType: submission.mimeType,
    sizeBytes: submission.sizeBytes,
    storageProvider: submission.storageProvider,
    storageKey: submission.storageKey,
    publicUrl: submission.publicUrl ?? null,
    status: submission.status,
    reviewNote: submission.reviewNote ?? null,
    reviewedByUserId: submission.reviewedByUserId
      ? submission.reviewedByUserId.toString()
      : null,
    reviewedAt: submission.reviewedAt ? submission.reviewedAt.toISOString() : null,
    createdAt: submission.createdAt.toISOString(),
    updatedAt: submission.updatedAt.toISOString(),
  };
}

function normalizeOptionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
