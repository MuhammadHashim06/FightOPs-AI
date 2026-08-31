import { model, models, Schema, type InferSchemaType } from "mongoose";

const fighterInviteTokenSchema = new Schema(
  {
    fighterId: {
      type: Schema.Types.ObjectId,
      ref: "Fighter",
      required: true,
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    fightId: {
      type: Schema.Types.ObjectId,
      ref: "Fight",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

fighterInviteTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type FighterInviteTokenDocument = InferSchemaType<typeof fighterInviteTokenSchema>;

export const FighterInviteTokenMongoModel =
  models.FighterInviteToken ||
  model("FighterInviteToken", fighterInviteTokenSchema);
