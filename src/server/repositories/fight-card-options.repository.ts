import type {
  FightCardOptionKind,
  FightCardOptionRecord,
} from "@/types/event";
import { connectToDatabase } from "@/server/db/mongoose";
import { FightCardOptionMongoModel } from "@/server/models/fight-card-option.model";

export async function listActiveFightCardOptions(kind: FightCardOptionKind) {
  await connectToDatabase();

  const options = await FightCardOptionMongoModel.find({ kind, isActive: true })
    .sort({ sortOrder: 1, label: 1 })
    .lean();

  return options.map(mapFightCardOption);
}

export async function ensureFightCardOptions(
  options: Array<Omit<FightCardOptionRecord, "id">>,
) {
  await connectToDatabase();

  await FightCardOptionMongoModel.bulkWrite(
    options.map((option) => ({
      updateOne: {
        filter: { kind: option.kind, key: option.key },
        update: { $setOnInsert: option },
        upsert: true,
      },
    })),
    { ordered: false },
  );
}

function mapFightCardOption(option: {
  _id: { toString(): string };
  kind: FightCardOptionKind;
  key: string;
  label: string;
  weightLimitKg?: number | null;
  weightLimitLb?: number | null;
  allowsCustomWeight?: boolean;
  sortOrder: number;
}) : FightCardOptionRecord {
  return {
    id: option._id.toString(),
    kind: option.kind,
    key: option.key,
    label: option.label,
    weightLimitKg: option.weightLimitKg ?? null,
    weightLimitLb: option.weightLimitLb ?? null,
    allowsCustomWeight: option.allowsCustomWeight ?? false,
    sortOrder: option.sortOrder,
  };
}
