import type {
  CreateFightInput,
  CreateFighterInput,
  EventRecord,
  FightRecord,
  UpdateFightInput,
} from "@/types/event";
import type { AuthUser } from "@/types/auth";
import { eventRequirementsRepository } from "@/server/repositories/event-requirements.repository";
import { fighterInvitesRepository } from "@/server/repositories/fighter-invites.repository";
import { fightersRepository } from "@/server/repositories/fighters.repository";
import { fighterReadinessRepository } from "@/server/repositories/fighter-readiness.repository";
import { fighterRequirementsRepository } from "@/server/repositories/fighter-requirements.repository";
import {
  createFight as createFightRecord,
  deleteFight as deleteFightRecord,
  getAllFights,
  getFightById,
  getNextFightOrder,
  updateFight as updateFightRecord,
} from "@/server/repositories/fights.repository";
import { reminderLogsRepository } from "@/server/repositories/reminder-logs.repository";
import { getEventById } from "@/server/services/events.service";
import { issueFighterInvite } from "@/server/services/fighter-invites.service";
import { buildDueDateByRequirementId } from "@/server/services/requirement-schedule.service";
import { syncEventReminderQueue } from "@/server/services/reminders.service";
import { recalculateFighterReadiness } from "@/server/services/readiness.service";

export async function listFights() {
  return getAllFights();
}

export async function findFightById(fightId: string) {
  return getFightById(fightId);
}

export async function createFightForEvent(
  eventId: string,
  input: CreateFightInput,
  invitedBy: Pick<AuthUser, "id" | "profile" | "email">,
) {
  const event = await getEventById(eventId);

  if (!event) {
    throw new Error("Event was not found.");
  }

  const normalizedInput = normalizeCreateFightInput(input);

  validateCreateFightInput(normalizedInput);

  const [fighterA, fighterB] = await Promise.all([
    normalizedInput.fighterA
      ? fightersRepository.createFighter(normalizedInput.fighterA)
      : Promise.resolve(null),
    normalizedInput.fighterB
      ? fightersRepository.createFighter(normalizedInput.fighterB)
      : Promise.resolve(null),
  ]);
  const order = await getNextFightOrder(eventId);

  const fight = await createFightRecord({
    eventId,
    order,
    division: normalizedInput.division.trim(),
    fighterAId: fighterA?.id ?? null,
    fighterBId: fighterB?.id ?? null,
  });

  const eventRequirements = await eventRequirementsRepository.listByEventId(eventId);
  const dueDateByRequirementId = buildDueDateByRequirementId({
    event,
    fight,
    eventRequirements,
  });

  await Promise.all(
    [fighterA, fighterB]
      .filter((fighter): fighter is NonNullable<typeof fighter> => Boolean(fighter))
      .map((fighter) =>
        fighterRequirementsRepository.ensureForFighter({
          eventId,
          fighterId: fighter.id,
          fightId: fight.id,
          eventRequirements,
          dueDateByRequirementId,
        }),
      ),
  );

  await Promise.all(
    [fighterA, fighterB]
      .filter((fighter): fighter is NonNullable<typeof fighter> => Boolean(fighter))
      .map((fighter) =>
        recalculateFighterReadiness({ eventId, fighterId: fighter.id }),
      ),
  );
  await syncEventReminderQueue(eventId);

  const [fighterAInvite, fighterBInvite] = await Promise.all([
    fighterA
      ? issueFighterInvite({
          fighter: fighterA,
          eventId,
          fightId: fight.id,
          invitedBy,
        })
      : Promise.resolve(null),
    fighterB
      ? issueFighterInvite({
          fighter: fighterB,
          eventId,
          fightId: fight.id,
          invitedBy,
        })
      : Promise.resolve(null),
  ]);

  return {
    fight,
    fighters: {
      fighterA,
      fighterB,
    },
    invites: {
      fighterA: fighterAInvite,
      fighterB: fighterBInvite,
    },
  };
}

export async function updateFightById(
  fightId: string,
  input: UpdateFightInput,
  invitedBy: Pick<AuthUser, "id" | "profile" | "email">,
) {
  const fight = await getFightById(fightId);

  if (!fight) {
    throw new Error("Fight was not found.");
  }

  const event = await getEventById(fight.eventId);

  if (!event) {
    throw new Error("Event was not found.");
  }

  const normalizedInput = normalizeCreateFightInput(input);

  validateCreateFightInput(normalizedInput);

  const eventRequirements = await eventRequirementsRepository.listByEventId(event.id);

  const fighterA = await upsertFightSide({
    existingFighterId: fight.fighterAId,
    fighterInput: normalizedInput.fighterA,
    eventId: event.id,
    fightId: fight.id,
    eventRequirements,
    event,
    fight,
    invitedBy,
  });
  const fighterB = await upsertFightSide({
    existingFighterId: fight.fighterBId,
    fighterInput: normalizedInput.fighterB,
    eventId: event.id,
    fightId: fight.id,
    eventRequirements,
    event,
    fight,
    invitedBy,
  });

  const updatedFight = await updateFightRecord({
    fightId,
    division: normalizedInput.division.trim(),
    fighterAId: fighterA?.id ?? fight.fighterAId,
    fighterBId: fighterB?.id ?? fight.fighterBId,
  });

  if (!updatedFight) {
    throw new Error("Fight was not found.");
  }

  await Promise.all(
    [updatedFight.fighterAId, updatedFight.fighterBId]
      .filter((fighterId): fighterId is string => Boolean(fighterId))
      .map((fighterId) => recalculateFighterReadiness({ eventId: event.id, fighterId })),
  );
  await syncEventReminderQueue(event.id);

  return updatedFight;
}

export async function deleteFightById(fightId: string) {
  const fight = await getFightById(fightId);

  if (!fight) {
    throw new Error("Fight was not found.");
  }

  await Promise.all([
    fighterRequirementsRepository.deleteByFightId(fight.id),
    fighterReadinessRepository.deleteByFightId(fight.id),
    reminderLogsRepository.deleteByFightId(fight.id),
    fighterInvitesRepository.deleteByFightId(fight.id),
  ]);

  const deletedFight = await deleteFightRecord(fight.id);

  if (!deletedFight) {
    throw new Error("Fight was not found.");
  }

  await syncEventReminderQueue(fight.eventId);

  return deletedFight;
}

export async function saveFightSideById(params: {
  fightId: string;
  side: "fighterA" | "fighterB";
  fighter: CreateFighterInput;
  invitedBy: Pick<AuthUser, "id" | "profile" | "email">;
}) {
  const fight = await getFightById(params.fightId);

  if (!fight) {
    throw new Error("Fight was not found.");
  }

  const event = await getEventById(fight.eventId);

  if (!event) {
    throw new Error("Event was not found.");
  }

  validateCreateFightInput({
    division: fight.division,
    fighterA: params.fighter,
    fighterB: null,
  });

  const eventRequirements = await eventRequirementsRepository.listByEventId(event.id);
  const dueDateByRequirementId = buildDueDateByRequirementId({
    event,
    fight,
    eventRequirements,
  });
  const existingFighterId = getFightSideFighterId(fight, params.side);

  if (existingFighterId) {
    const existingFighter = await fightersRepository.findFighterById(existingFighterId);

    if (!existingFighter) {
      throw new Error("Fighter was not found.");
    }

    const normalizedExistingEmail = existingFighter.managerEmail?.trim().toLowerCase() ?? "";
    const normalizedInputEmail = params.fighter.managerEmail.trim().toLowerCase();

    if (normalizedExistingEmail !== normalizedInputEmail) {
      throw new Error("Contact email cannot be changed. Remove and add the fighter again.");
    }

    const updatedFighter = await fightersRepository.updateFighter({
      ...existingFighter,
      fullName: params.fighter.fullName.trim(),
      division: params.fighter.division?.trim() || null,
      managerName: params.fighter.managerName.trim(),
      managerPhone: params.fighter.managerPhone?.trim() || null,
      contractReference: params.fighter.contractReference?.trim() || null,
      updatedAt: new Date().toISOString(),
    });

    await fighterRequirementsRepository.ensureForFighter({
      eventId: event.id,
      fighterId: updatedFighter.id,
      fightId: fight.id,
      eventRequirements,
      dueDateByRequirementId,
    });
    await recalculateFighterReadiness({
      eventId: event.id,
      fighterId: updatedFighter.id,
    });
    await syncEventReminderQueue(event.id);

    return {
      fight,
      fighter: updatedFighter,
    };
  }

  const createdFighter = await fightersRepository.createFighter(params.fighter);
  const updatedFight = await updateFightRecord(
    setFightSideFighterId(fight, params.side, createdFighter.id),
  );

  if (!updatedFight) {
    throw new Error("Fight was not found.");
  }

  await fighterRequirementsRepository.ensureForFighter({
    eventId: event.id,
    fighterId: createdFighter.id,
    fightId: fight.id,
    eventRequirements,
    dueDateByRequirementId,
  });
  await recalculateFighterReadiness({
    eventId: event.id,
    fighterId: createdFighter.id,
  });

  await issueFighterInvite({
    fighter: createdFighter,
    eventId: event.id,
    fightId: fight.id,
    invitedBy: params.invitedBy,
  });
  await syncEventReminderQueue(event.id);

  return {
    fight: updatedFight,
    fighter: createdFighter,
  };
}

export async function removeFightSideById(params: {
  fightId: string;
  side: "fighterA" | "fighterB";
}) {
  const fight = await getFightById(params.fightId);

  if (!fight) {
    throw new Error("Fight was not found.");
  }

  const fighterId = getFightSideFighterId(fight, params.side);

  if (!fighterId) {
    return fight;
  }

  await Promise.all([
    fighterRequirementsRepository.deleteByEventAndFighter(fight.eventId, fighterId),
    fighterReadinessRepository.deleteByEventAndFighter(fight.eventId, fighterId),
    reminderLogsRepository.deleteByEventAndFighter(fight.eventId, fighterId),
    fighterInvitesRepository.deleteByFightAndFighter(fight.id, fighterId),
  ]);

  const updatedFight = await updateFightRecord(
    setFightSideFighterId(fight, params.side, null),
  );

  if (!updatedFight) {
    throw new Error("Fight was not found.");
  }

  await syncEventReminderQueue(fight.eventId);

  return updatedFight;
}

export async function reinviteFightSideById(params: {
  fightId: string;
  side: "fighterA" | "fighterB";
  invitedBy: Pick<AuthUser, "id" | "profile" | "email">;
}) {
  const fight = await getFightById(params.fightId);

  if (!fight) {
    throw new Error("Fight was not found.");
  }

  const fighterId = getFightSideFighterId(fight, params.side);

  if (!fighterId) {
    throw new Error("No fighter is assigned to this slot.");
  }

  const fighter = await fightersRepository.findFighterById(fighterId);

  if (!fighter) {
    throw new Error("Fighter was not found.");
  }

  return issueFighterInvite({
    fighter,
    eventId: fight.eventId,
    fightId: fight.id,
    invitedBy: params.invitedBy,
  });
}

function validateCreateFightInput(input: CreateFightInput) {
  if (!input.division.trim()) {
    throw new Error("Fight division is required.");
  }

  for (const fighter of [input.fighterA, input.fighterB]) {
    if (!fighter) {
      continue;
    }

    if (!fighter.fullName.trim()) {
      throw new Error("Fighter name is required.");
    }

    if (!fighter.managerName.trim()) {
      throw new Error("Manager name is required.");
    }

    if (!fighter.managerEmail.trim()) {
      throw new Error("Contact email is required.");
    }
  }
}

function normalizeCreateFightInput(input: CreateFightInput): CreateFightInput {
  return {
    division: input.division,
    fighterA: normalizeFightSideInput(input.fighterA),
    fighterB: normalizeFightSideInput(input.fighterB),
  };
}

function normalizeFightSideInput(input: CreateFightInput["fighterA"]) {
  if (!input) {
    return null;
  }

  const values = [
    input.fullName,
    input.managerName,
    input.managerEmail,
    input.managerPhone,
    input.division,
    input.notes,
    input.contractReference,
  ];

  const hasAnyValue = values.some((value) => value?.trim());

  if (!hasAnyValue) {
    return null;
  }

  return input;
}

async function upsertFightSide(params: {
  existingFighterId: string | null;
  fighterInput: CreateFightInput["fighterA"];
  eventId: string;
  fightId: string;
  eventRequirements: Awaited<ReturnType<typeof eventRequirementsRepository.listByEventId>>;
  event: EventRecord;
  fight: FightRecord;
  invitedBy: Pick<AuthUser, "id" | "profile" | "email">;
}) {
  if (!params.fighterInput) {
    if (!params.existingFighterId) {
      return null;
    }

    return fightersRepository.findFighterById(params.existingFighterId);
  }

  if (params.existingFighterId) {
    const existingFighter = await fightersRepository.findFighterById(
      params.existingFighterId,
    );

    if (!existingFighter) {
      throw new Error("Fighter was not found.");
    }

    return fightersRepository.updateFighter({
      ...existingFighter,
      fullName: params.fighterInput.fullName.trim(),
      division: params.fighterInput.division?.trim() || null,
      managerName: params.fighterInput.managerName.trim(),
      managerEmail: params.fighterInput.managerEmail.trim().toLowerCase(),
      managerPhone: params.fighterInput.managerPhone?.trim() || null,
      contractReference: params.fighterInput.contractReference?.trim() || null,
      updatedAt: new Date().toISOString(),
    });
  }

  const fighter = await fightersRepository.createFighter(params.fighterInput);
  const dueDateByRequirementId = buildDueDateByRequirementId({
    event: params.event,
    fight: params.fight,
    eventRequirements: params.eventRequirements,
  });

  await fighterRequirementsRepository.ensureForFighter({
    eventId: params.eventId,
    fighterId: fighter.id,
    fightId: params.fightId,
    eventRequirements: params.eventRequirements,
    dueDateByRequirementId,
  });
  await recalculateFighterReadiness({
    eventId: params.eventId,
    fighterId: fighter.id,
  });
  await issueFighterInvite({
    fighter,
    eventId: params.eventId,
    fightId: params.fightId,
    invitedBy: params.invitedBy,
  });

  return fighter;
}

function getFightSideFighterId(
  fight: FightRecord,
  side: "fighterA" | "fighterB",
) {
  return side === "fighterA" ? fight.fighterAId : fight.fighterBId;
}

function setFightSideFighterId(
  fight: FightRecord,
  side: "fighterA" | "fighterB",
  fighterId: string | null,
) {
  return {
    fightId: fight.id,
    division: fight.division,
    fighterAId: side === "fighterA" ? fighterId : fight.fighterAId,
    fighterBId: side === "fighterB" ? fighterId : fight.fighterBId,
  };
}
