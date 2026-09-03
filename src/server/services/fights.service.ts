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
  getFightByEventAndFighterId,
  getFightsByEventId,
  getFightById,
  getNextFightOrder,
  reorderFights,
  updateFight as updateFightRecord,
} from "@/server/repositories/fights.repository";
import { reminderLogsRepository } from "@/server/repositories/reminder-logs.repository";
import { auditLogsRepository } from "@/server/repositories/audit-logs.repository";
import {
  getEventById,
  getEventByIdForUser,
  listEventsForUser,
} from "@/server/services/events.service";
import { issueFighterInvite } from "@/server/services/fighter-invites.service";
import { buildDueDateByRequirementId } from "@/server/services/requirement-schedule.service";
import { refreshFighterReminderSchedules } from "@/server/services/reminders.service";
import { recalculateFighterReadiness } from "@/server/services/readiness.service";

export async function listFights() {
  return getAllFights();
}

export async function listFightsForUser(user: AuthUser) {
  if (user.role === "admin") {
    return listFights();
  }

  if (user.role !== "promoter") {
    return [];
  }

  const events = await listEventsForUser(user);
  const fights = await Promise.all(events.map((event) => getFightsByEventId(event.id)));
  return fights.flat();
}

export async function findFightById(fightId: string) {
  return getFightById(fightId);
}

export async function findFightByIdForUser(fightId: string, user: AuthUser) {
  const fight = await getFightById(fightId);

  if (!fight || !(await getEventByIdForUser(fight.eventId, user))) {
    return null;
  }

  return fight;
}

export async function reorderFightsForEvent(
  eventId: string,
  fightIds: string[],
  user: AuthUser,
) {
  const event = await getEventByIdForUser(eventId, user);

  if (!event) {
    throw new Error("Event was not found.");
  }

  const fights = await getFightsByEventId(eventId);
  const existingFightIds = new Set(fights.map((fight) => fight.id));
  const submittedFightIds = new Set(fightIds);

  if (
    fightIds.length !== fights.length ||
    submittedFightIds.size !== fightIds.length ||
    fightIds.some((fightId) => !existingFightIds.has(fightId))
  ) {
    throw new Error("Fight order must include every fight in this event exactly once.");
  }

  return reorderFights(eventId, fightIds);
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
  assertDistinctContactEmails(normalizedInput);

  const fighterA = normalizedInput.fighterA
    ? await resolveFighterForAssignment({
        input: normalizedInput.fighterA,
        eventId,
      })
    : null;
  const fighterB = normalizedInput.fighterB
    ? await resolveFighterForAssignment({
        input: normalizedInput.fighterB,
        eventId,
      })
    : null;
  const order = await getNextFightOrder(eventId);

  const fight = await createFightRecord({
    eventId,
    order,
    cardGroup: normalizedInput.cardGroup ?? "main_card",
    division: normalizedInput.division.trim(),
    catchweightKg: normalizedInput.catchweightKg ?? null,
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
  await Promise.all(
    [fighterA, fighterB]
      .filter((fighter): fighter is NonNullable<typeof fighter> => Boolean(fighter))
      .map((fighter) => refreshFighterReminderSchedules(eventId, fighter.id)),
  );

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

  await auditLogsRepository.create({
    eventId, fighterId: null, fightId: fight.id, requirementId: null,
    actorUserId: invitedBy.id, action: "fight_created", stateFrom: "NONE", stateTo: fight.status,
    note: `${fight.division} fight card created`,
  });

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
  assertDistinctContactEmails(normalizedInput);

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

  if (fighterA?.id && fighterA.id === fighterB?.id) {
    throw new Error("Fighter A and Fighter B must be different fighters.");
  }

  const updatedFight = await updateFightRecord({
    fightId,
    cardGroup: normalizedInput.cardGroup ?? fight.cardGroup,
    division: normalizedInput.division.trim(),
    catchweightKg: normalizedInput.catchweightKg ?? null,
    fighterAId: fighterA?.id ?? fight.fighterAId,
    fighterBId: fighterB?.id ?? fight.fighterBId,
  });

  if (!updatedFight) {
    throw new Error("Fight was not found.");
  }

  await auditLogsRepository.create({
    eventId: event.id, fighterId: null, fightId: updatedFight.id, requirementId: null,
    actorUserId: invitedBy.id, action: "fight_updated", stateFrom: fight.status, stateTo: updatedFight.status,
    note: `${updatedFight.division} fight card updated`,
  });

  await Promise.all(
    [updatedFight.fighterAId, updatedFight.fighterBId]
      .filter((fighterId): fighterId is string => Boolean(fighterId))
      .map((fighterId) => recalculateFighterReadiness({ eventId: event.id, fighterId })),
  );
  await Promise.all(
    [updatedFight.fighterAId, updatedFight.fighterBId]
      .filter((fighterId): fighterId is string => Boolean(fighterId))
      .map((fighterId) => refreshFighterReminderSchedules(event.id, fighterId)),
  );

  return updatedFight;
}

export async function deleteFightById(fightId: string, actorUserId: string) {
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

  await auditLogsRepository.create({
    eventId: fight.eventId, fighterId: null, fightId: fight.id, requirementId: null,
    actorUserId, action: "fight_deleted", stateFrom: fight.status, stateTo: "DELETED",
    note: `${fight.division} fight card deleted`,
  });

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

    assertContactEmailUnchanged(existingFighter.managerEmail, params.fighter.managerEmail);

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
    await refreshFighterReminderSchedules(event.id, updatedFighter.id);

    return {
      fight,
      fighter: updatedFighter,
    };
  }

  const fighter = await resolveFighterForAssignment({
    input: params.fighter,
    eventId: event.id,
    excludeFightId: fight.id,
  });

  if (fighter.id === getFightSideFighterId(fight, otherFightSide(params.side))) {
    throw new Error("This fighter is already assigned to the other side of this fight.");
  }

  const updatedFight = await updateFightRecord(
    setFightSideFighterId(fight, params.side, fighter.id),
  );

  if (!updatedFight) {
    throw new Error("Fight was not found.");
  }

  await fighterRequirementsRepository.ensureForFighter({
    eventId: event.id,
    fighterId: fighter.id,
    fightId: fight.id,
    eventRequirements,
    dueDateByRequirementId,
  });
  await recalculateFighterReadiness({
    eventId: event.id,
    fighterId: fighter.id,
  });

  await issueFighterInvite({
    fighter,
    eventId: event.id,
    fightId: fight.id,
    invitedBy: params.invitedBy,
  });
  await refreshFighterReminderSchedules(event.id, fighter.id);

  return {
    fight: updatedFight,
    fighter,
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

async function resolveFighterForAssignment(params: {
  input: CreateFighterInput;
  eventId: string;
  excludeFightId?: string;
}) {
  const normalizedEmail = params.input.managerEmail.trim().toLowerCase();
  const existingFighter = await fightersRepository.findFighterByContactEmail(
    normalizedEmail,
  );

  if (existingFighter) {
    const linkedFight = await getFightByEventAndFighterId(
      params.eventId,
      existingFighter.id,
      params.excludeFightId,
    );

    if (linkedFight) {
      throw new Error(
        `${existingFighter.fullName} is already assigned to another fight in this event.`,
      );
    }

    return fightersRepository.updateFighter({
      ...existingFighter,
      fullName: params.input.fullName.trim(),
      division: params.input.division?.trim() || existingFighter.division,
      managerName: params.input.managerName.trim(),
      managerEmail: normalizedEmail,
      managerPhone: params.input.managerPhone?.trim() || existingFighter.managerPhone,
      contractReference:
        params.input.contractReference?.trim() || existingFighter.contractReference,
      updatedAt: new Date().toISOString(),
    });
  }

  return fightersRepository.createFighter({
    fullName: params.input.fullName.trim(),
    division: params.input.division?.trim(),
    managerName: params.input.managerName.trim(),
    managerEmail: normalizedEmail,
    managerPhone: params.input.managerPhone?.trim(),
    contractReference: params.input.contractReference?.trim(),
  });
}

function assertDistinctContactEmails(input: CreateFightInput) {
  const emails = [input.fighterA, input.fighterB]
    .filter((fighter): fighter is CreateFighterInput => Boolean(fighter))
    .map((fighter) => fighter.managerEmail.trim().toLowerCase());

  if (new Set(emails).size !== emails.length) {
    throw new Error("Fighter A and Fighter B must have different contact emails.");
  }
}

function assertContactEmailUnchanged(
  existingEmail: string | null,
  inputEmail: string,
) {
  const normalizedExistingEmail = existingEmail?.trim().toLowerCase() ?? "";
  const normalizedInputEmail = inputEmail.trim().toLowerCase();

  if (normalizedExistingEmail !== normalizedInputEmail) {
    throw new Error("Contact email cannot be changed. Remove and add the fighter again.");
  }
}

function validateCreateFightInput(input: CreateFightInput) {
  if (!input.cardGroup?.trim()) {
    throw new Error("Fight card group is invalid.");
  }

  if (input.division === "Catchweight" && (!input.catchweightKg || input.catchweightKg <= 0)) {
    throw new Error("A custom catchweight in kilograms is required.");
  }

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
    cardGroup: input.cardGroup ?? "main_card",
    division: input.division,
    catchweightKg: input.catchweightKg ?? null,
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

    assertContactEmailUnchanged(existingFighter.managerEmail, params.fighterInput.managerEmail);

    return fightersRepository.updateFighter({
      ...existingFighter,
      fullName: params.fighterInput.fullName.trim(),
      division: params.fighterInput.division?.trim() || null,
      managerName: params.fighterInput.managerName.trim(),
      managerEmail: existingFighter.managerEmail,
      managerPhone: params.fighterInput.managerPhone?.trim() || null,
      contractReference: params.fighterInput.contractReference?.trim() || null,
      updatedAt: new Date().toISOString(),
    });
  }

  const fighter = await resolveFighterForAssignment({
    input: params.fighterInput,
    eventId: params.eventId,
    excludeFightId: params.fightId,
  });
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

function otherFightSide(side: "fighterA" | "fighterB") {
  return side === "fighterA" ? "fighterB" : "fighterA";
}

function setFightSideFighterId(
  fight: FightRecord,
  side: "fighterA" | "fighterB",
  fighterId: string | null,
) {
  return {
    fightId: fight.id,
    cardGroup: fight.cardGroup,
    division: fight.division,
    catchweightKg: fight.catchweightKg,
    fighterAId: side === "fighterA" ? fighterId : fight.fighterAId,
    fighterBId: side === "fighterB" ? fighterId : fight.fighterBId,
  };
}
