import { model, models, Schema, type InferSchemaType } from "mongoose";

const reminderLogSchema = new Schema(
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
    kind: {
      type: String,
      enum: ["fighter_reminder", "deadline_alert"],
      default: "fighter_reminder",
      required: true,
      index: true,
    },
    recipientName: {
      type: String,
      required: true,
      trim: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    requirementName: {
      type: String,
      required: true,
      trim: true,
    },
    eventName: {
      type: String,
      required: true,
      trim: true,
    },
    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "SENT", "SKIPPED", "FAILED"],
      default: "PENDING",
      required: true,
      index: true,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    attemptCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastError: {
      type: String,
      default: null,
      trim: true,
    },
    nextAttemptAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

reminderLogSchema.index(
  { eventId: 1, fighterId: 1, eventRequirementId: 1, kind: 1, scheduledFor: 1 },
  { unique: true },
);

export type ReminderLogDocument = InferSchemaType<typeof reminderLogSchema>;

export const ReminderLogMongoModel =
  models.ReminderLog || model("ReminderLog", reminderLogSchema);
