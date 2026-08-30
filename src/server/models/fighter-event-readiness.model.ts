import { model, models, Schema, type InferSchemaType } from "mongoose";

const fighterEventReadinessSchema = new Schema(
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
    opponentFighterId: {
      type: Schema.Types.ObjectId,
      ref: "Fighter",
      default: null,
      index: true,
    },
    readinessPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      required: true,
    },
    status: {
      type: String,
      enum: ["READY", "WAITING", "HUMAN_ACTION", "PROCESSING"],
      default: "WAITING",
      required: true,
      index: true,
    },
    nextAction: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

fighterEventReadinessSchema.index({ eventId: 1, fighterId: 1 }, { unique: true });

export type FighterEventReadinessDocument = InferSchemaType<
  typeof fighterEventReadinessSchema
>;

export const FighterEventReadinessMongoModel =
  models.FighterEventReadiness ||
  model("FighterEventReadiness", fighterEventReadinessSchema);
