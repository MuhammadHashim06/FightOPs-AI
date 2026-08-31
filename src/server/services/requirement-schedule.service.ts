import type { EventRecord, FightRecord, FighterRecord } from "@/types/event";
import type { EventRequirementRecord } from "@/types/readiness";

export function buildDueDateByRequirementId(params: {
  event: EventRecord;
  fight: FightRecord;
  fighter?: FighterRecord | null;
  signedAgreementApprovedAt?: string | null;
  eventRequirements: EventRequirementRecord[];
}) {
  return new Map(
    params.eventRequirements.map((requirement) => [
      requirement.id,
      resolveRequirementDueDate({
        event: params.event,
        fight: params.fight,
        fighter: params.fighter,
        signedAgreementApprovedAt: params.signedAgreementApprovedAt,
        requirement,
      }),
    ]),
  );
}

export function resolveRequirementDueDate(params: {
  event: EventRecord;
  fight: FightRecord;
  fighter?: FighterRecord | null;
  signedAgreementApprovedAt?: string | null;
  requirement: EventRequirementRecord;
}) {
  if (params.requirement.dueDate) {
    return params.requirement.dueDate;
  }

  if (params.requirement.dueAnchor === "custom_date") {
    return null;
  }

  const offsetDays = params.requirement.dueOffsetDays;

  if (typeof offsetDays !== "number") {
    return null;
  }

  if (params.requirement.dueAnchor === "before_event") {
    return addDays(params.event.date, -offsetDays);
  }

  if (params.requirement.dueAnchor === "after_fight_scheduled") {
    return addDays(params.fight.createdAt, offsetDays);
  }

  if (params.requirement.dueAnchor === "after_invite_accepted") {
    return params.fighter?.inviteAcceptedAt
      ? addDays(params.fighter.inviteAcceptedAt, offsetDays)
      : null;
  }

  if (params.requirement.dueAnchor === "after_signed_agreement_approved") {
    return params.signedAgreementApprovedAt
      ? addDays(params.signedAgreementApprovedAt, offsetDays)
      : null;
  }

  return null;
}

function addDays(dateIso: string, days: number) {
  const date = new Date(dateIso);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}
