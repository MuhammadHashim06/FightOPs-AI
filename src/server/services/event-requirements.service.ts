import type { CreateEventRequirementInput, UpdateEventRequirementInput } from "@/types/readiness";
import { eventRequirementsRepository } from "@/server/repositories/event-requirements.repository";
import { fighterRequirementsRepository } from "@/server/repositories/fighter-requirements.repository";
import { fightersRepository } from "@/server/repositories/fighters.repository";
import { getFightsByEventId } from "@/server/repositories/fights.repository";
import { getEventById } from "@/server/services/events.service";
import { buildDueDateByRequirementId } from "@/server/services/requirement-schedule.service";
import { refreshEventRequirementReminderSchedules } from "@/server/services/reminders.service";
import { recalculateFighterReadiness } from "@/server/services/readiness.service";
import { reminderLogsRepository } from "@/server/repositories/reminder-logs.repository";
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

  const [fighterLinks, fights] = await Promise.all([
    fightersRepository.listEventFighterLinks(eventId),
    getFightsByEventId(eventId),
  ]);
  const fighters = await fightersRepository.listFightersByIds(
    fighterLinks.map((link) => link.fighterId),
  );
  const fightMap = new Map(fights.map((fight) => [fight.id, fight]));
  const fighterMap = new Map(fighters.map((fighter) => [fighter.id, fighter]));

  await fighterRequirementsRepository.ensureRequirementForFighters({
    eventId,
    eventRequirement: requirement,
    assignments: fighterLinks.map((link) => {
      const fight = link.fightId ? fightMap.get(link.fightId) : null;
      const fighter = fighterMap.get(link.fighterId);
      const dueDateByRequirementId =
        fight && fighter
          ? buildDueDateByRequirementId({
              event,
              fight,
              fighter,
              eventRequirements: [requirement],
            })
          : null;

      return {
        fighterId: link.fighterId,
        fightId: link.fightId,
        dueDate:
          dueDateByRequirementId?.get(requirement.id) ?? requirement.dueDate,
      };
    }),
  });

  for (const link of fighterLinks) {
    await recalculateFighterReadiness({ eventId, fighterId: link.fighterId });
  }

  await refreshEventRequirementReminderSchedules(eventId, requirement.id);

  return requirement;
}

export async function updateEventRequirement(
  eventId: string,
  requirementId: string,
  input: UpdateEventRequirementInput,
) {
  const current = await eventRequirementsRepository.listByEventId(eventId);
  const existing = current.find((item) => item.id === requirementId);
  if (!existing) throw new Error("Requirement was not found.");

  const merged = { ...existing, ...input } as CreateEventRequirementInput;
  validateCreateEventRequirementInput(merged);
  const requirement = await eventRequirementsRepository.update(eventId, requirementId, merged);
  if (!requirement) throw new Error("Requirement was not found.");

  const fighterRequirements = await fighterRequirementsRepository.listByEventRequirementId(eventId, requirementId);
  await Promise.all(fighterRequirements.map((item) => recalculateFighterReadiness({ eventId, fighterId: item.fighterId })));
  await refreshEventRequirementReminderSchedules(eventId, requirementId);
  return requirement;
}

export async function deleteEventRequirement(eventId: string, requirementId: string) {
  const requirement = await eventRequirementsRepository.deactivate(eventId, requirementId);
  if (!requirement) throw new Error("Requirement was not found.");
  await Promise.all([
    fighterRequirementsRepository.deleteByEventRequirementId(eventId, requirementId),
    reminderLogsRepository.deleteByEventRequirementId(eventId, requirementId),
  ]);
  return requirement;
}
