import type {
  FightCardOptionKind,
  FightCardOptionRecord,
} from "@/types/event";
import {
  ensureFightCardOptions,
  listActiveFightCardOptions,
} from "@/server/repositories/fight-card-options.repository";

const defaultFightCardOptions: Array<Omit<FightCardOptionRecord, "id">> = [
  { kind: "group", key: "main_card", label: "Main Card", weightLimitKg: null, weightLimitLb: null, allowsCustomWeight: false, sortOrder: 10 },
  { kind: "group", key: "prelims", label: "Prelims", weightLimitKg: null, weightLimitLb: null, allowsCustomWeight: false, sortOrder: 20 },
  { kind: "weight_class", key: "Strawweight", label: "Strawweight", weightLimitKg: 52.2, weightLimitLb: 115.1, allowsCustomWeight: false, sortOrder: 10 },
  { kind: "weight_class", key: "Flyweight", label: "Flyweight", weightLimitKg: 56.7, weightLimitLb: 125, allowsCustomWeight: false, sortOrder: 20 },
  { kind: "weight_class", key: "Bantamweight", label: "Bantamweight", weightLimitKg: 61.2, weightLimitLb: 134.9, allowsCustomWeight: false, sortOrder: 30 },
  { kind: "weight_class", key: "Featherweight", label: "Featherweight", weightLimitKg: 65.8, weightLimitLb: 145.1, allowsCustomWeight: false, sortOrder: 40 },
  { kind: "weight_class", key: "Lightweight", label: "Lightweight", weightLimitKg: 70.3, weightLimitLb: 155, allowsCustomWeight: false, sortOrder: 50 },
  { kind: "weight_class", key: "Welterweight", label: "Welterweight", weightLimitKg: 77.1, weightLimitLb: 170, allowsCustomWeight: false, sortOrder: 60 },
  { kind: "weight_class", key: "Middleweight", label: "Middleweight", weightLimitKg: 83.9, weightLimitLb: 185, allowsCustomWeight: false, sortOrder: 70 },
  { kind: "weight_class", key: "Light Heavyweight", label: "Light Heavyweight", weightLimitKg: 93, weightLimitLb: 205, allowsCustomWeight: false, sortOrder: 80 },
  { kind: "weight_class", key: "Heavyweight", label: "Heavyweight", weightLimitKg: 120.2, weightLimitLb: 265, allowsCustomWeight: false, sortOrder: 90 },
  { kind: "weight_class", key: "Super Heavyweight", label: "Super Heavyweight", weightLimitKg: null, weightLimitLb: null, allowsCustomWeight: false, sortOrder: 100 },
  { kind: "weight_class", key: "Catchweight", label: "Catchweight", weightLimitKg: null, weightLimitLb: null, allowsCustomWeight: true, sortOrder: 110 },
];

export async function listFightCardOptions(kind: FightCardOptionKind) {
  await ensureFightCardOptions(defaultFightCardOptions.filter((option) => option.kind === kind));
  return listActiveFightCardOptions(kind);
}
