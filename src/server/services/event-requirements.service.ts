import type { CreateEventRequirementInput } from "@/types/readiness";
import { eventRequirementsRepository } from "@/server/repositories/event-requirements.repository";
import { fighterRequirementsRepository } from "@/server/repositories/fighter-requirements.repository";
import { fightersRepository } from "@/server/repositories/fighters.repository";
import { getEventById } from "@/server/services/events.service";
import { syncEventReminderQueue } from "@/server/services/reminders.service";
import { recalculateFighterReadiness } from "@/server/services/readiness.service";
import { validateCreateEventRequirementInput } from "@/server/validators/readiness.validator";

export async function listEventRequirements(eventId: string) {
  return eventRequirementsRepository.listByEventId(eventId);
}

export async function createEventRequirement(
  eventId: string,
  input: CreateEventRequirementInput,
) {
  validateCreateEventRequirementInput(input);

  const event = await getEventById(eventId);

  if (!event) {
    throw new Error("Event was not found.");
  }

  const sortOrder =
    typeof input.sortOrder === "number"
      ? input.sortOrder
      : await eventRequirementsRepository.getNextSortOrder(eventId);

  const requirement = await eventRequirementsRepository.create(eventId, {
    ...input,
    sortOrder,
  });

  const fighterLinks = await fightersRepository.listEventFighterLinks(eventId);

  for (const link of fighterLinks) {
    await fighterRequirementsRepository.ensureForFighter({
      eventId,
      fighterId: link.fighterId,
      fightId: link.fightId,
      eventRequirements: [requirement],
    });

    await recalculateFighterReadiness({
      eventId,
      fighterId: link.fighterId,
    });
  }

  await syncEventReminderQueue(eventId);

  return requirement;
}
