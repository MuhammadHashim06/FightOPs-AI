import type { FighterEventReadinessRecord, ReadinessStatus } from "@/types/readiness";
import { connectToDatabase } from "@/server/db/mongoose";
import { FighterEventReadinessMongoModel } from "@/server/models/fighter-event-readiness.model";

export const fighterReadinessRepository = {
  async listByEventId(eventId: string) {
    await connectToDatabase();

    const readinessItems = await FighterEventReadinessMongoModel.find({
      eventId,
    }).lean();

    return readinessItems.map(mapFighterReadiness);
  },
  async findByEventAndFighter(eventId: string, fighterId: string) {
    await connectToDatabase();

    const readiness = await FighterEventReadinessMongoModel.findOne({
      eventId,
      fighterId,
    }).lean();

    return readiness ? mapFighterReadiness(readiness) : null;
  },
  async upsert(params: {
    eventId: string;
    fighterId: string;
    fightId: string | null;
    opponentFighterId: string | null;
    readinessPercentage: number;
    status: ReadinessStatus;
    nextAction: string | null;
  }) {
    await connectToDatabase();

    const readiness = await FighterEventReadinessMongoModel.findOneAndUpdate(
      {
        eventId: params.eventId,
        fighterId: params.fighterId,
      },
      {
        eventId: params.eventId,
        fighterId: params.fighterId,
        fightId: params.fightId,
        opponentFighterId: params.opponentFighterId,
        readinessPercentage: params.readinessPercentage,
        status: params.status,
        nextAction: params.nextAction,
      },
      {
        returnDocument: "after",
        upsert: true,
      },
    ).lean();

    return mapFighterReadiness(readiness);
  },
  async deleteByFightId(fightId: string) {
    await connectToDatabase();

    const result = await FighterEventReadinessMongoModel.deleteMany({ fightId });
    return result.deletedCount ?? 0;
  },
  async deleteByEventId(eventId: string) {
    await connectToDatabase();

    const result = await FighterEventReadinessMongoModel.deleteMany({ eventId });
    return result.deletedCount ?? 0;
  },
  async deleteByEventAndFighter(eventId: string, fighterId: string) {
    await connectToDatabase();

    const result = await FighterEventReadinessMongoModel.deleteMany({
      eventId,
      fighterId,
    });

    return result.deletedCount ?? 0;
  },
};

function mapFighterReadiness(readiness: {
  _id: { toString(): string };
  eventId: { toString(): string };
  fighterId: { toString(): string };
  fightId: { toString(): string } | null;
  opponentFighterId: { toString(): string } | null;
  readinessPercentage: number;
  status: FighterEventReadinessRecord["status"];
  nextAction: string | null;
  createdAt: Date;
  updatedAt: Date;
}): FighterEventReadinessRecord {
  return {
    id: readiness._id.toString(),
    eventId: readiness.eventId.toString(),
    fighterId: readiness.fighterId.toString(),
    fightId: readiness.fightId ? readiness.fightId.toString() : null,
    opponentFighterId: readiness.opponentFighterId
      ? readiness.opponentFighterId.toString()
      : null,
    readinessPercentage: readiness.readinessPercentage,
    status: readiness.status,
    nextAction: readiness.nextAction ?? null,
    createdAt: readiness.createdAt.toISOString(),
    updatedAt: readiness.updatedAt.toISOString(),
  };
}
