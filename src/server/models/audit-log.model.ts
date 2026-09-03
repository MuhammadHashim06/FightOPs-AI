import { model, models, Schema, type InferSchemaType } from "mongoose";

const auditLogSchema = new Schema(
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
      default: null,
      index: true,
    },
    fightId: {
      type: Schema.Types.ObjectId,
      ref: "Fight",
      default: null,
      index: true,
    },
    requirementId: {
      type: Schema.Types.ObjectId,
      ref: "FighterRequirement",
      default: null,
      index: true,
    },
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    stateFrom: {
      type: String,
      required: true,
      trim: true,
    },
    stateTo: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

auditLogSchema.index({ eventId: 1, createdAt: -1 });

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema>;

export const AuditLogMongoModel =
  models.AuditLog || model("AuditLog", auditLogSchema);
