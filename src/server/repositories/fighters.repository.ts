import type { FighterRecord } from "@/types/event";
import { connectToDatabase } from "@/server/db/mongoose";
import { FightMongoModel } from "@/server/models/fight.model";
import { FighterMongoModel } from "@/server/models/fighter.model";

export const fightersRepository = {
  async createFighter(input: {
    fullName: string;
    managerName: string;
    managerEmail: string;
    managerPhone?: string;
    division?: string;
    contractReference?: string;
  }) {
    await connectToDatabase();

    const fighter = await FighterMongoModel.create({
      fullName: input.fullName,
      division: normalizeOptionalText(input.division),
      managerName: normalizeOptionalText(input.managerName),
      managerEmail: normalizeOptionalText(input.managerEmail),
      managerPhone: normalizeOptionalText(input.managerPhone),
      contractReference: normalizeOptionalText(input.contractReference),
      inviteStatus: "pending",
      inviteSentAt: null,
      inviteAcceptedAt: null,
    });

    return mapFighter(fighter.toObject());
  },
  async updateFighter(input: FighterRecord) {
    await connectToDatabase();

    const fighter = await FighterMongoModel.findByIdAndUpdate(
      input.id,
      {
        userId: input.userId,
        fullName: input.fullName,
        nationality: normalizeOptionalText(input.nationality ?? undefined),
        stance: normalizeOptionalText(input.stance ?? undefined),
        division: normalizeOptionalText(input.division ?? undefined),
        managerName: normalizeOptionalText(input.managerName ?? undefined),
        managerEmail: normalizeOptionalText(input.managerEmail ?? undefined),
        managerPhone: normalizeOptionalText(input.managerPhone ?? undefined),
        photoUrl: normalizeOptionalText(input.photoUrl ?? undefined),
        contractReference: normalizeOptionalText(input.contractReference ?? undefined),
        inviteStatus: input.inviteStatus,
        inviteSentAt: toDate(input.inviteSentAt),
        inviteAcceptedAt: toDate(input.inviteAcceptedAt),
        updatedAt: toDate(input.updatedAt),
      },
      { returnDocument: "after" },
    ).lean();

    if (!fighter) {
      throw new Error("Fighter was not found.");
    }

    return mapFighter(fighter);
  },
  async listEventFighterLinks(eventId: string) {
    await connectToDatabase();

    const fights = await FightMongoModel.find({ eventId })
      .select({ _id: 1, fighterAId: 1, fighterBId: 1 })
      .lean();

    const links = new Map<
      string,
      { fighterId: string; fightId: string | null; opponentFighterId: string | null }
    >();

    for (const fight of fights) {
      const fightId = fight._id.toString();
      const fighterAId = fight.fighterAId?.toString() ?? null;
      const fighterBId = fight.fighterBId?.toString() ?? null;

      if (fighterAId && !links.has(fighterAId)) {
        links.set(fighterAId, {
          fighterId: fighterAId,
          fightId,
          opponentFighterId: fighterBId,
        });
      }

      if (fighterBId && !links.has(fighterBId)) {
        links.set(fighterBId, {
          fighterId: fighterBId,
          fightId,
          opponentFighterId: fighterAId,
        });
      }
    }

    return Array.from(links.values());
  },
  async listFightersByIds(fighterIds: string[]) {
    await connectToDatabase();

    const fighters = await FighterMongoModel.find({
      _id: { $in: fighterIds },
    }).lean();

    return fighters.map(mapFighter);
  },
  async listFightersByEventId(eventId: string) {
    const links = await this.listEventFighterLinks(eventId);
    const fighterIds = links.map((link) => link.fighterId);
    return this.listFightersByIds(fighterIds);
  },
  async findFighterById(fighterId: string) {
    if (!fighterId?.trim()) {
      return null;
    }

    await connectToDatabase();

    const fighter = await FighterMongoModel.findById(fighterId).lean();
    return fighter ? mapFighter(fighter) : null;
  },
  async findFighterByUserId(userId: string) {
    await connectToDatabase();

    const fighter = await FighterMongoModel.findOne({ userId }).lean();
    return fighter ? mapFighter(fighter) : null;
  },
  async listFightersByAccount(input: { userId: string; email: string }) {
    await connectToDatabase();

    const fighters = await FighterMongoModel.find({
      $or: [{ userId: input.userId }, { managerEmail: input.email.toLowerCase() }],
    }).lean();

    return fighters.map(mapFighter);
  },
};

function normalizeOptionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function mapFighter(fighter: {
  _id: { toString(): string };
  userId: { toString(): string } | null;
  fullName: string;
  nationality: string | null;
  stance: string | null;
  division: string | null;
  managerName: string | null;
  managerEmail: string | null;
  managerPhone: string | null;
  photoUrl: string | null;
  contractReference: string | null;
  inviteStatus: "pending" | "accepted";
  inviteSentAt: Date | null;
  inviteAcceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): FighterRecord {
  return {
    id: fighter._id.toString(),
    userId: fighter.userId ? fighter.userId.toString() : null,
    fullName: fighter.fullName,
    nationality: fighter.nationality ?? null,
    stance: fighter.stance ?? null,
    division: fighter.division ?? null,
    managerName: fighter.managerName ?? null,
    managerEmail: fighter.managerEmail ?? null,
    managerPhone: fighter.managerPhone ?? null,
    photoUrl: fighter.photoUrl ?? null,
    contractReference: fighter.contractReference ?? null,
    inviteStatus: fighter.inviteStatus,
    inviteSentAt: toIso(fighter.inviteSentAt),
    inviteAcceptedAt: toIso(fighter.inviteAcceptedAt),
    createdAt: fighter.createdAt.toISOString(),
    updatedAt: fighter.updatedAt.toISOString(),
  };
}

function toDate(value: string | null) {
  return value ? new Date(value) : null;
}

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}
