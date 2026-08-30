import { model, models, Schema, type InferSchemaType } from "mongoose";

const fighterSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    nationality: {
      type: String,
      default: null,
      trim: true,
    },
    stance: {
      type: String,
      default: null,
      trim: true,
    },
    division: {
      type: String,
      default: null,
      trim: true,
    },
    managerName: {
      type: String,
      default: null,
      trim: true,
    },
    managerEmail: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    managerPhone: {
      type: String,
      default: null,
      trim: true,
    },
    photoUrl: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export type FighterDocument = InferSchemaType<typeof fighterSchema>;

export const FighterMongoModel = models.Fighter || model("Fighter", fighterSchema);
