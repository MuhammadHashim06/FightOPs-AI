import type { FighterInviteToken } from "@/types/auth";
import { connectToDatabase } from "@/server/db/mongoose";
import { FighterInviteTokenMongoModel } from "@/server/models/fighter-invite-token.model";

export const fighterInvitesRepository = {
  async createInviteToken(input: Omit<FighterInviteToken, "id">) {
    await connectToDatabase();

    const token = await FighterInviteTokenMongoModel.create({
      fighterId: input.fighterId,
      eventId: input.eventId,
      fightId: input.fightId,
      email: input.email,
      tokenHash: input.tokenHash,
      expiresAt: toDate(input.expiresAt),
      createdAt: toDate(input.createdAt),
      consumedAt: toDate(input.consumedAt),
    });

    return mapInviteToken(token.toObject());
  },
  async findInviteTokenByHash(tokenHash: string) {
    await connectToDatabase();

    const token = await FighterInviteTokenMongoModel.findOne({
      tokenHash,
    }).lean();

    return token ? mapInviteToken(token) : null;
  },
  async consumeInviteToken(tokenId: string) {
    await connectToDatabase();

    await FighterInviteTokenMongoModel.findByIdAndUpdate(tokenId, {
      consumedAt: new Date(),
    });
  },
  async consumePendingByFightAndFighter(fightId: string, fighterId: string) {
    await connectToDatabase();

    const result = await FighterInviteTokenMongoModel.updateMany(
      {
        fightId,
        fighterId,
        consumedAt: null,
        expiresAt: { $gt: new Date() },
      },
      { $set: { consumedAt: new Date() } },
    );

    return result.modifiedCount ?? 0;
  },
  async deleteByFightId(fightId: string) {
    await connectToDatabase();

    const result = await FighterInviteTokenMongoModel.deleteMany({ fightId });
    return result.deletedCount ?? 0;
  },
  async deleteByEventId(eventId: string) {
    await connectToDatabase();

    const result = await FighterInviteTokenMongoModel.deleteMany({ eventId });
    return result.deletedCount ?? 0;
  },
  async deleteByFightAndFighter(fightId: string, fighterId: string) {
    await connectToDatabase();

    const result = await FighterInviteTokenMongoModel.deleteMany({
      fightId,
      fighterId,
    });

    return result.deletedCount ?? 0;
  },
};

function mapInviteToken(token: {
  _id: { toString(): string };
  fighterId: { toString(): string };
  eventId: { toString(): string };
  fightId: { toString(): string };
  email: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  consumedAt: Date | null;
}): FighterInviteToken {
  return {
    id: token._id.toString(),
    fighterId: token.fighterId.toString(),
    eventId: token.eventId.toString(),
    fightId: token.fightId.toString(),
    email: token.email,
    tokenHash: token.tokenHash,
    expiresAt: token.expiresAt.toISOString(),
    createdAt: token.createdAt.toISOString(),
    consumedAt: toIso(token.consumedAt),
  };
}

function toDate(value: string | null) {
  return value ? new Date(value) : null;
}

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}
