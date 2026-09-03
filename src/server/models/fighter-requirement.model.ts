import { model, models, Schema, type InferSchemaType } from "mongoose";

const fighterRequirementSchema = new Schema(
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
    status: {
      type: String,
      enum: [
        "WAITING",
        "PROCESSING",
        "RECEIVED",
        "ACCEPTED",
        "NEEDS_RESUBMISSION",
        "HUMAN_ACTION",
        "NOT_APPLICABLE",
      ],
      default: "WAITING",
      required: true,
      index: true,
    },
    required: {
      type: Boolean,
      default: true,
      required: true,
    },
    priority: {
      type: String,
      enum: ["critical", "high", "medium", "low"],
      default: "medium",
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    humanVerificationRequired: {
      type: Boolean,
      default: false,
      required: true,
    },
    overrideReason: {
      type: String,
      default: null,
      trim: true,
    },
    aiConfidence: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    aiReason: {
      type: String,
      default: null,
      trim: true,
    },
    latestSubmissionId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    nextReminderAt: {
      type: Date,
      default: null,
    },
    lastReminderAt: {
      type: Date,
      default: null,
    },
    reminderAttemptCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    reminderLockedUntil: {
      type: Date,
      default: null,
    },
    reminderClaimToken: {
      type: String,
      default: null,
    },
    nextDeadlineAlertAt: {
      type: Date,
      default: null,
    },
    deadlineAlertSentAt: {
      type: Date,
      default: null,
    },
    deadlineAlertAttemptCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    reminderStoppedReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

fighterRequirementSchema.index(
  { eventId: 1, fighterId: 1, eventRequirementId: 1 },
  { unique: true },
);
fighterRequirementSchema.index({ status: 1, nextReminderAt: 1, reminderLockedUntil: 1 });
fighterRequirementSchema.index({ status: 1, nextDeadlineAlertAt: 1, reminderLockedUntil: 1 });

export type FighterRequirementDocument = InferSchemaType<typeof fighterRequirementSchema>;

export const FighterRequirementMongoModel =
  models.FighterRequirement || model("FighterRequirement", fighterRequirementSchema);
