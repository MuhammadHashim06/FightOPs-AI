import { model, models, Schema, type InferSchemaType } from "mongoose";

const documentSubmissionSchema = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    fighterId: {
      type: Schema.Types.ObjectId,
      ref: "Fighter",
      required: true,
      index: true,
    },
    fightId: {
      type: Schema.Types.ObjectId,
      ref: "Fight",
      default: null,
      index: true,
    },
    eventRequirementId: {
      type: Schema.Types.ObjectId,
      ref: "EventRequirement",
      required: true,
      index: true,
    },
    fighterRequirementId: {
      type: Schema.Types.ObjectId,
      ref: "FighterRequirement",
      required: true,
      index: true,
    },
    uploadedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    sizeBytes: {
      type: Number,
      required: true,
      min: 0,
    },
    storageProvider: {
      type: String,
      enum: ["local", "r2"],
      default: "local",
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
      trim: true,
    },
    publicUrl: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: ["PENDING_REVIEW", "ACCEPTED", "REJECTED"],
      default: "PENDING_REVIEW",
      required: true,
      index: true,
    },
    reviewNote: {
      type: String,
      default: null,
      trim: true,
    },
    reviewedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

documentSubmissionSchema.index({
  eventId: 1,
  fighterId: 1,
  fighterRequirementId: 1,
  createdAt: -1,
});

export type DocumentSubmissionDocument = InferSchemaType<
  typeof documentSubmissionSchema
>;

export const DocumentSubmissionMongoModel =
  models.DocumentSubmission ||
  model("DocumentSubmission", documentSubmissionSchema);
