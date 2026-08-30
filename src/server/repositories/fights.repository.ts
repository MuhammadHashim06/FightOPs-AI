import type { FightRecord } from "@/types/event";
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
  division: string;
  fighterAId: string;
  fighterBId: string;
}) {
  await connectToDatabase();

  const fight = await FightMongoModel.create({
    eventId: input.eventId,
    order: input.order,
    division: input.division,
    fighterAId: input.fighterAId,
    fighterBId: input.fighterBId,
    status: "WAITING",
    readinessPercentage: 0,
  });

  return mapFight(fight.toObject());
}

function mapFight(fight: {
  _id: { toString(): string };
  eventId: { toString(): string };
  order: number;
  division: string;
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
    division: fight.division,
    fighterAId: fight.fighterAId ? fight.fighterAId.toString() : null,
    fighterBId: fight.fighterBId ? fight.fighterBId.toString() : null,
    status: fight.status,
    readinessPercentage: fight.readinessPercentage,
    createdAt: fight.createdAt.toISOString(),
    updatedAt: fight.updatedAt.toISOString(),
  };
}
