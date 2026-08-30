import { model, models, Schema, type InferSchemaType } from "mongoose";

const fightSchema = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    division: {
      type: String,
      required: true,
      trim: true,
    },
    fighterAId: {
      type: Schema.Types.ObjectId,
      ref: "Fighter",
      default: null,
      index: true,
    },
    fighterBId: {
      type: Schema.Types.ObjectId,
      ref: "Fighter",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["READY", "WAITING", "HUMAN_ACTION", "PROCESSING"],
      default: "WAITING",
      required: true,
      index: true,
    },
    readinessPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  },
);

fightSchema.index({ eventId: 1, order: 1 }, { unique: true });

export type FightDocument = InferSchemaType<typeof fightSchema>;

export const FightMongoModel = models.Fight || model("Fight", fightSchema);
