import type { CreateFightInput } from "@/types/event";
import { eventRequirementsRepository } from "@/server/repositories/event-requirements.repository";
import { fightersRepository } from "@/server/repositories/fighters.repository";
import { fighterRequirementsRepository } from "@/server/repositories/fighter-requirements.repository";
import {
  createFight as createFightRecord,
  getAllFights,
  getFightById,
  getNextFightOrder,
} from "@/server/repositories/fights.repository";
import { getEventById } from "@/server/services/events.service";
import { syncEventReminderQueue } from "@/server/services/reminders.service";
import { recalculateFighterReadiness } from "@/server/services/readiness.service";

export async function listFights() {
  return getAllFights();
}

export async function findFightById(fightId: string) {
  return getFightById(fightId);
}

export async function createFightForEvent(eventId: string, input: CreateFightInput) {
  const event = await getEventById(eventId);

  if (!event) {
    throw new Error("Event was not found.");
  }

  validateCreateFightInput(input);

  const fighterA = await fightersRepository.createFighter(input.fighterA);
  const fighterB = await fightersRepository.createFighter(input.fighterB);
  const order = await getNextFightOrder(eventId);

  const fight = await createFightRecord({
    eventId,
    order,
    division: input.division.trim(),
    fighterAId: fighterA.id,
    fighterBId: fighterB.id,
  });

  const eventRequirements = await eventRequirementsRepository.listByEventId(eventId);

  await fighterRequirementsRepository.ensureForFighter({
    eventId,
    fighterId: fighterA.id,
    fightId: fight.id,
    eventRequirements,
  });
  await fighterRequirementsRepository.ensureForFighter({
    eventId,
    fighterId: fighterB.id,
    fightId: fight.id,
    eventRequirements,
  });

  await recalculateFighterReadiness({ eventId, fighterId: fighterA.id });
  await recalculateFighterReadiness({ eventId, fighterId: fighterB.id });
  await syncEventReminderQueue(eventId);

  return {
    fight,
    fighters: {
      fighterA,
      fighterB,
    },
  };
}

function validateCreateFightInput(input: CreateFightInput) {
  if (!input.division.trim()) {
    throw new Error("Fight division is required.");
  }

  for (const fighter of [input.fighterA, input.fighterB]) {
    if (!fighter.fullName.trim()) {
      throw new Error("Fighter name is required.");
    }

    if (!fighter.managerName.trim()) {
      throw new Error("Manager name is required.");
    }

    if (!fighter.managerEmail.trim()) {
      throw new Error("Manager email is required.");
    }
  }
}
