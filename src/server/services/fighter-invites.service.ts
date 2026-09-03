import { createHash, randomUUID } from "node:crypto";

import { env } from "@/server/config/env";
import { getDashboardPathForRole } from "@/features/dashboard/lib/dashboard-routes";
import { authRepository } from "@/server/repositories/auth.repository";
import { eventRequirementsRepository } from "@/server/repositories/event-requirements.repository";
import { fighterInvitesRepository } from "@/server/repositories/fighter-invites.repository";
import { fightersRepository } from "@/server/repositories/fighters.repository";
import { fighterRequirementsRepository } from "@/server/repositories/fighter-requirements.repository";
import { auditLogsRepository } from "@/server/repositories/audit-logs.repository";
import { getFightById } from "@/server/repositories/fights.repository";
import { hashPassword } from "@/server/security/password";
import {
  createSessionToken,
  hashSessionToken,
} from "@/server/security/session";
import { getEventById } from "@/server/services/events.service";
import { sendFighterInviteEmail } from "@/server/services/email.service";
import { buildDueDateByRequirementId } from "@/server/services/requirement-schedule.service";
import { refreshFighterReminderSchedules } from "@/server/services/reminders.service";
import { validateAcceptFighterInviteInput } from "@/server/validators/auth.validator";
import type {
  AcceptFighterInviteInput,
  AuthUser,
  FighterInviteToken,
} from "@/types/auth";
import type { FighterRecord } from "@/types/event";

type IssueFighterInviteInput = {
  fighter: FighterRecord;
  eventId: string;
  fightId: string;
  invitedBy: Pick<AuthUser, "id" | "profile" | "email">;
};

type AcceptInviteContext = {
  token: string;
  fighterName: string;
  contactEmail: string;
  eventName: string;
  eventDate: string;
  promoterName: string;
  division: string;
  expiresAt: string;
  hasActiveAccount: boolean;
};

type AcceptInviteContextResult =
  | {
      isValid: true;
      invite: AcceptInviteContext;
    }
  | {
      isValid: false;
    };

type AcceptInviteResult = {
  user: AuthUser;
  sessionToken: string;
  redirectTo: string;
};

type LoginContext = {
  userAgent?: string | null;
  ipAddress?: string | null;
};

export async function issueFighterInvite(input: IssueFighterInviteInput) {
  const contactEmail = input.fighter.managerEmail?.trim().toLowerCase();

  if (!contactEmail) {
    throw new Error("Contact email is required.");
  }

  const event = await getEventById(input.eventId);

  if (!event) {
    throw new Error("Event was not found.");
  }

  const fight = await getFightById(input.fightId);

  if (!fight) {
    throw new Error("Fight was not found.");
  }

  const rawToken = randomUUID();
  const now = new Date().toISOString();
  await fighterInvitesRepository.consumePendingByFightAndFighter(
    input.fightId,
    input.fighter.id,
  );
  const inviteToken = await fighterInvitesRepository.createInviteToken(
    createInviteTokenRecord({
      fighterId: input.fighter.id,
      eventId: input.eventId,
      fightId: input.fightId,
      email: contactEmail,
      rawToken,
      now,
    }),
  );

  await fightersRepository.updateFighter({
    ...input.fighter,
    inviteStatus: "pending",
    inviteSentAt: now,
    updatedAt: now,
  });

  await sendFighterInviteEmail({
    email: contactEmail,
    fighterName: input.fighter.fullName,
    promoterName: input.invitedBy.profile.displayName,
    eventName: event.name,
    eventDate: event.date.slice(0, 10),
    division: fight.division,
    acceptUrl: createAcceptInviteUrl(rawToken),
    expiresInDays: env.authFighterInviteExpiresInDays,
  });

  return {
    inviteToken,
    acceptUrl: createAcceptInviteUrl(rawToken),
  };
}

export async function getFighterInviteContext(
  rawToken: string | null | undefined,
): Promise<AcceptInviteContextResult> {
  if (!rawToken) {
    return { isValid: false };
  }

  const inviteToken = await fighterInvitesRepository.findInviteTokenByHash(hashValue(rawToken));

  if (!isInviteUsable(inviteToken)) {
    return { isValid: false };
  }

  const activeInviteToken = inviteToken;

  const fighter = await fightersRepository.findFighterById(activeInviteToken.fighterId);
  const event = await getEventById(activeInviteToken.eventId);
  const fight = await getFightById(activeInviteToken.fightId);

  if (!fighter || !event || !fight || !fighter.managerEmail) {
    return { isValid: false };
  }

  const promoter = await authRepository.findUserById(event.createdByUserId);
  const existingUser = await authRepository.findUserByEmail(fighter.managerEmail);

  return {
    isValid: true,
    invite: {
      token: rawToken,
      fighterName: fighter.fullName,
      contactEmail: fighter.managerEmail,
      eventName: event.name,
      eventDate: event.date.slice(0, 10),
      promoterName: promoter?.profile.displayName ?? "Operations team",
      division: fight.division,
      expiresAt: activeInviteToken.expiresAt,
      hasActiveAccount:
        existingUser?.role === "fighter" && existingUser.status === "active",
    },
  };
}

export async function acceptFighterInvite(
  input: AcceptFighterInviteInput,
  context: LoginContext = {},
): Promise<AcceptInviteResult> {
  const inviteToken = await fighterInvitesRepository.findInviteTokenByHash(
    hashValue(input.token),
  );

  if (!isInviteUsable(inviteToken)) {
    throw new Error("Invite link is invalid or expired.");
  }

  const activeInviteToken = inviteToken;

  const fighter = await fightersRepository.findFighterById(activeInviteToken.fighterId);

  if (!fighter || !fighter.managerEmail) {
    throw new Error("Fighter invite is no longer available.");
  }

  let user = await authRepository.findUserByEmail(fighter.managerEmail);
  const now = new Date().toISOString();

  if (user && user.role !== "fighter") {
    throw new Error("This email is already linked to a different account type.");
  }

  const requiresPasswordSetup = !user || user.status !== "active";
  const password = input.password ?? "";

  if (requiresPasswordSetup) {
    validateAcceptFighterInviteInput(input);
  }

  if (!user) {
    const profile = buildUserProfileFromName(fighter.fullName);

    user = await authRepository.createUser({
      email: fighter.managerEmail,
      role: "fighter",
      provider: "credentials",
      status: "active",
      emailVerifiedAt: now,
      passwordHash: hashPassword(password),
      profile,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    });
  } else if (requiresPasswordSetup) {
    user = await authRepository.updateUser({
      ...user,
      status: "active",
      emailVerifiedAt: user.emailVerifiedAt ?? now,
      passwordHash: hashPassword(password),
      lastLoginAt: now,
      updatedAt: now,
    });
  } else {
    user = await authRepository.updateUser({
      ...user,
      status: "active",
      emailVerifiedAt: user.emailVerifiedAt ?? now,
      lastLoginAt: now,
      updatedAt: now,
    });
  }

  const acceptedFighter = await fightersRepository.updateFighter({
    ...fighter,
    userId: user.id,
    inviteStatus: "accepted",
    inviteAcceptedAt: now,
    updatedAt: now,
  });
  await fighterInvitesRepository.consumeInviteToken(activeInviteToken.id);
  await refreshAcceptedInviteRequirementSchedule({
    fighter: acceptedFighter,
    eventId: activeInviteToken.eventId,
    fightId: activeInviteToken.fightId,
  });

  await auditLogsRepository.create({
    eventId: activeInviteToken.eventId, fighterId: acceptedFighter.id,
    fightId: activeInviteToken.fightId, requirementId: null, actorUserId: user.id,
    action: "invite_accepted", stateFrom: "PENDING", stateTo: "ACCEPTED",
    note: "Fighter accepted the event invitation.",
  });

  const sessionToken = createSessionToken();
  await authRepository.createSession({
    userId: user.id,
    refreshTokenHash: hashSessionToken(sessionToken),
    userAgent: context.userAgent ?? null,
    ipAddress: context.ipAddress ?? null,
    createdAt: now,
    expiresAt: addDays(now, env.authRefreshTokenExpiresInDays),
    revokedAt: null,
  });

  return {
    user,
    sessionToken,
    redirectTo: getDashboardPathForRole("fighter"),
  };
}

async function refreshAcceptedInviteRequirementSchedule(params: {
  fighter: FighterRecord;
  eventId: string;
  fightId: string;
}) {
  const [event, fight, eventRequirements] = await Promise.all([
    getEventById(params.eventId),
    getFightById(params.fightId),
    eventRequirementsRepository.listByEventId(params.eventId),
  ]);

  if (!event || !fight) {
    return;
  }

  await fighterRequirementsRepository.updateDueDatesForFighter({
    eventId: params.eventId,
    fighterId: params.fighter.id,
    dueDateByRequirementId: buildDueDateByRequirementId({
      event,
      fight,
      fighter: params.fighter,
      eventRequirements,
    }),
  });
  await refreshFighterReminderSchedules(params.eventId, params.fighter.id);
}

function createInviteTokenRecord(input: {
  fighterId: string;
  eventId: string;
  fightId: string;
  email: string;
  rawToken: string;
  now: string;
}): Omit<FighterInviteToken, "id"> {
  return {
    fighterId: input.fighterId,
    eventId: input.eventId,
    fightId: input.fightId,
    email: input.email,
    tokenHash: hashValue(input.rawToken),
    createdAt: input.now,
    expiresAt: addDays(input.now, env.authFighterInviteExpiresInDays),
    consumedAt: null,
  };
}

function isInviteUsable(
  inviteToken: FighterInviteToken | null,
): inviteToken is FighterInviteToken {
  if (!inviteToken || inviteToken.consumedAt) {
    return false;
  }

  return new Date(inviteToken.expiresAt).getTime() > Date.now();
}

function buildUserProfileFromName(fullName: string) {
  const normalizedName = fullName.trim();
  const [firstName = "Fighter", ...rest] = normalizedName.split(/\s+/);
  const lastName = rest.join(" ").trim() || "User";

  return {
    firstName,
    lastName,
    displayName: normalizedName || `${firstName} ${lastName}`.trim(),
  };
}

function createAcceptInviteUrl(rawToken: string) {
  return `${env.appUrl}/auth/accept-invite?token=${encodeURIComponent(rawToken)}`;
}

function hashValue(value: string) {
  return createHash("sha256")
    .update(`${env.authSecret}:${value}`)
    .digest("hex");
}

function addDays(isoDate: string, days: number) {
  return new Date(new Date(isoDate).getTime() + days * 24 * 60 * 60_000).toISOString();
}
