import { model, models, Schema, type InferSchemaType } from "mongoose";

const fightCardOptionSchema = new Schema(
  {
    kind: {
      type: String,
      enum: ["group", "weight_class"],
      required: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    weightLimitKg: {
      type: Number,
      default: null,
      min: 0,
    },
    weightLimitLb: {
      type: Number,
      default: null,
      min: 0,
    },
    allowsCustomWeight: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

fightCardOptionSchema.index({ kind: 1, key: 1 }, { unique: true });
fightCardOptionSchema.index({ kind: 1, isActive: 1, sortOrder: 1 });

export type FightCardOptionDocument = InferSchemaType<typeof fightCardOptionSchema>;

export const FightCardOptionMongoModel =
  models.FightCardOption || model("FightCardOption", fightCardOptionSchema);
