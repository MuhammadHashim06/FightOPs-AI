import { model, models, Schema, type InferSchemaType } from "mongoose";

const fighterSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
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
    contractReference: {
      type: String,
      default: null,
      trim: true,
    },
    inviteStatus: {
      type: String,
      enum: ["pending", "accepted"],
      default: "pending",
      required: true,
    },
    inviteSentAt: {
      type: Date,
      default: null,
    },
    inviteAcceptedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export type FighterDocument = InferSchemaType<typeof fighterSchema>;

export const FighterMongoModel = models.Fighter || model("Fighter", fighterSchema);
