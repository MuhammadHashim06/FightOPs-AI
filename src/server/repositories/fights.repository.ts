import type { FightCardGroup, FightRecord } from "@/types/event";
import { connectToDatabase } from "@/server/db/mongoose";
import { FightMongoModel } from "@/server/models/fight.model";

export async function getAllFights() {
  await connectToDatabase();

  const fights = await FightMongoModel.find().sort({ createdAt: -1 }).lean();
  return fights.map(mapFight);
}

export async function getFightById(fightId: string) {
  await connectToDatabase();

  const fight = await FightMongoModel.findById(fightId).lean();
  return fight ? mapFight(fight) : null;
}

export async function getFightsByEventId(eventId: string) {
  await connectToDatabase();

  const fights = await FightMongoModel.find({ eventId }).sort({ order: 1 }).lean();
  return fights.map(mapFight);
}

export async function getFightsByFighterId(fighterId: string) {
  await connectToDatabase();

  const fights = await FightMongoModel.find({
    $or: [{ fighterAId: fighterId }, { fighterBId: fighterId }],
  })
    .sort({ createdAt: -1 })
    .lean();

  return fights.map(mapFight);
}

export async function getFightByEventAndFighterId(
  eventId: string,
  fighterId: string,
  excludeFightId?: string,
) {
  await connectToDatabase();

  const query: {
    eventId: string;
    $or: Array<{ fighterAId: string } | { fighterBId: string }>;
    _id?: { $ne: string };
  } = {
    eventId,
    $or: [{ fighterAId: fighterId }, { fighterBId: fighterId }],
  };

  if (excludeFightId) {
    query._id = { $ne: excludeFightId };
  }

  const fight = await FightMongoModel.findOne(query).lean();
  return fight ? mapFight(fight) : null;
}

export async function getNextFightOrder(eventId: string) {
  await connectToDatabase();

  const latestFight = await FightMongoModel.findOne({ eventId })
    .sort({ order: -1 })
    .select({ order: 1 })
    .lean();

  return (latestFight?.order ?? 0) + 1;
}

export async function createFight(input: {
  eventId: string;
  order: number;
  cardGroup: FightCardGroup;
  division: string;
  catchweightKg: number | null;
  fighterAId: string | null;
  fighterBId: string | null;
}) {
  await connectToDatabase();

  const fight = await FightMongoModel.create({
    eventId: input.eventId,
    order: input.order,
    cardGroup: input.cardGroup,
    division: input.division,
    catchweightKg: input.catchweightKg,
    fighterAId: input.fighterAId,
    fighterBId: input.fighterBId,
    status: "WAITING",
    readinessPercentage: 0,
  });

  return mapFight(fight.toObject());
}

export async function updateFight(input: {
  fightId: string;
  cardGroup: FightCardGroup;
  division: string;
  catchweightKg: number | null;
  fighterAId: string | null;
  fighterBId: string | null;
}) {
  await connectToDatabase();

  const fight = await FightMongoModel.findByIdAndUpdate(
    input.fightId,
    {
      cardGroup: input.cardGroup,
      division: input.division,
      catchweightKg: input.catchweightKg,
      fighterAId: input.fighterAId,
      fighterBId: input.fighterBId,
    },
    { returnDocument: "after" },
  ).lean();

  return fight ? mapFight(fight) : null;
}

export async function deleteFight(fightId: string) {
  await connectToDatabase();

  const fight = await FightMongoModel.findByIdAndDelete(fightId).lean();
  return fight ? mapFight(fight) : null;
}

export async function deleteFightsByEventId(eventId: string) {
  await connectToDatabase();

  const result = await FightMongoModel.deleteMany({ eventId });
  return result.deletedCount ?? 0;
}

export async function reorderFights(eventId: string, fightIds: string[]) {
  await connectToDatabase();

  const fights = await FightMongoModel.find({ eventId })
    .select({ _id: 1, order: 1 })
    .lean();
  const maxOrder = fights.reduce((max, fight) => Math.max(max, fight.order), 0);
  const temporaryOffset = maxOrder + fights.length + 1;

  await FightMongoModel.bulkWrite(
    fights.map((fight) => ({
      updateOne: {
        filter: { _id: fight._id },
        update: { $set: { order: fight.order + temporaryOffset } },
      },
    })),
    { ordered: true },
  );

  await FightMongoModel.bulkWrite(
    fightIds.map((fightId, index) => ({
      updateOne: {
        filter: { _id: fightId, eventId },
        update: { $set: { order: index + 1 } },
      },
    })),
    { ordered: true },
  );

  const reorderedFights = await FightMongoModel.find({ eventId })
    .sort({ order: 1 })
    .lean();
  return reorderedFights.map(mapFight);
}

function mapFight(fight: {
  _id: { toString(): string };
  eventId: { toString(): string };
  order: number;
  cardGroup?: FightCardGroup;
  division: string;
  catchweightKg?: number | null;
  fighterAId: { toString(): string } | null;
  fighterBId: { toString(): string } | null;
  status: FightRecord["status"];
  readinessPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}): FightRecord {
  return {
    id: fight._id.toString(),
    eventId: fight.eventId.toString(),
    order: fight.order,
    cardGroup: fight.cardGroup ?? "main_card",
    division: fight.division,
    catchweightKg: fight.catchweightKg ?? null,
    fighterAId: fight.fighterAId ? fight.fighterAId.toString() : null,
    fighterBId: fight.fighterBId ? fight.fighterBId.toString() : null,
    status: fight.status,
    readinessPercentage: fight.readinessPercentage,
    createdAt: fight.createdAt.toISOString(),
    updatedAt: fight.updatedAt.toISOString(),
  };
}
