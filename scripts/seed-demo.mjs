import { existsSync, readFileSync } from "node:fs";
import { createHash, randomBytes, scryptSync } from "node:crypto";
import mongoose from "mongoose";

loadEnvFile(".env");

const databaseUrl = process.env.DATABASE_URL;
const databaseName = process.env.DATABASE_NAME || "fightops";
const eventSlug = "desert-clash-14";
const demoPassword = "DemoPass123!";

if (!databaseUrl) {
  console.error("DATABASE_URL is not configured. Add it to .env before seeding.");
  process.exit(1);
}

const requirementTemplates = [
  {
    key: "signed-agreement",
    category: "Contracts",
    name: "Signed Agreement",
    priority: "critical",
    dueAnchor: "after_invite_accepted",
    dueOffsetDays: 5,
    reminderDaysBeforeDue: [5],
    humanVerificationRequired: true,
    isSignedAgreement: true,
    description: "Signed bout agreement must be uploaded before remaining readiness tasks unlock.",
    acceptedFileTypes: ["pdf", "doc", "docx"],
  },
  {
    key: "passport-id",
    category: "Legal",
    name: "Passport / ID",
    priority: "critical",
    dueAnchor: "after_signed_agreement_approved",
    dueOffsetDays: 4,
    reminderDaysBeforeDue: [3],
    humanVerificationRequired: true,
    description: "Government ID or passport for event operations and travel verification.",
    acceptedFileTypes: ["pdf", "jpg", "jpeg", "png"],
  },
  {
    key: "medical-clearance",
    category: "Medical",
    name: "Medical Clearance",
    priority: "critical",
    dueAnchor: "before_event",
    dueOffsetDays: 14,
    reminderDaysBeforeDue: [7],
    humanVerificationRequired: true,
    description: "Medical certificate or clearance required by the promotion.",
    acceptedFileTypes: ["pdf", "jpg", "jpeg", "png"],
  },
  {
    key: "insurance-certificate",
    category: "Insurance",
    name: "Insurance Certificate",
    priority: "high",
    dueAnchor: "before_event",
    dueOffsetDays: 10,
    reminderDaysBeforeDue: [5],
    humanVerificationRequired: true,
    description: "Insurance confirmation for bout participation.",
    acceptedFileTypes: ["pdf", "jpg", "jpeg", "png"],
  },
  {
    key: "visa-information",
    category: "Visa",
    name: "Visa Information",
    priority: "high",
    dueAnchor: "after_signed_agreement_approved",
    dueOffsetDays: 7,
    reminderDaysBeforeDue: [5],
    humanVerificationRequired: false,
    description: "Visa status, passport details, and invitation letter requirements.",
    acceptedFileTypes: ["pdf", "jpg", "jpeg", "png"],
  },
  {
    key: "travel-information",
    category: "Travel",
    name: "Travel Information",
    priority: "medium",
    dueAnchor: "after_signed_agreement_approved",
    dueOffsetDays: 10,
    reminderDaysBeforeDue: [5],
    humanVerificationRequired: false,
    description: "Preferred travel dates, arrival/departure time windows, and booking notes.",
    acceptedFileTypes: ["pdf", "jpg", "jpeg", "png"],
  },
  {
    key: "accommodation-details",
    category: "Accommodation",
    name: "Accommodation Details",
    priority: "medium",
    dueAnchor: "before_event",
    dueOffsetDays: 12,
    reminderDaysBeforeDue: [5],
    humanVerificationRequired: false,
    description: "Rooming needs, team size, check-in notes, and hotel preferences.",
    acceptedFileTypes: ["pdf", "jpg", "jpeg", "png"],
  },
  {
    key: "media-headshot",
    category: "Media",
    name: "Media / Headshot",
    priority: "medium",
    dueAnchor: "after_signed_agreement_approved",
    dueOffsetDays: 7,
    reminderDaysBeforeDue: [4],
    humanVerificationRequired: false,
    description: "Current headshot and media information for fight graphics.",
    acceptedFileTypes: ["pdf", "jpg", "jpeg", "png"],
  },
  {
    key: "weight-confirmation",
    category: "Weight",
    name: "Weight Confirmation",
    priority: "high",
    dueAnchor: "before_event",
    dueOffsetDays: 5,
    reminderDaysBeforeDue: [3],
    humanVerificationRequired: false,
    description: "Recent weight check and confirmation against contracted weight.",
    acceptedFileTypes: ["pdf", "jpg", "jpeg", "png"],
  },
];

const fighters = [
  ["Ahmed Al-Farsi", "Khalid Mansour", "ahmed.alfarsi.demo@fightops.ai", "United Arab Emirates", "Orthodox", "Lightweight", "ready"],
  ["Lucas Ferreira", "Diego Souza", "lucas.ferreira.demo@fightops.ai", "Brazil", "Southpaw", "Lightweight", "ai-handling"],
  ["Marcus Reed", "Oliver Grant", "marcus.reed.demo@fightops.ai", "United Kingdom", "Orthodox", "Welterweight", "human-escalation"],
  ["Yusuf Demir", "Emre Aydin", "yusuf.demir.demo@fightops.ai", "Turkey", "Southpaw", "Welterweight", "processing"],
  ["Hiroshi Tanaka", "Kenji Mori", "hiroshi.tanaka.demo@fightops.ai", "Japan", "Switch", "Featherweight", "ready"],
  ["Diego Morales", "Rafael Costa", "diego.morales.demo@fightops.ai", "Mexico", "Orthodox", "Featherweight", "human-escalation"],
  ["Sven Lindqvist", "Mikael Berg", "sven.lindqvist.demo@fightops.ai", "Sweden", "Orthodox", "Middleweight", "processing"],
  ["Omar Haddad", "Nabil Karim", "omar.haddad.demo@fightops.ai", "Jordan", "Southpaw", "Middleweight", "ready"],
  ["Raj Patel", "Amit Rao", "raj.patel.demo@fightops.ai", "India", "Orthodox", "Bantamweight", "ai-handling"],
  ["Chen Wei", "Li Jun", "chen.wei.demo@fightops.ai", "China", "Switch", "Bantamweight", "ready"],
  ["Bruno Costa", "Mateo Silva", "bruno.costa.demo@fightops.ai", "Brazil", "Orthodox", "Heavyweight", "processing"],
  ["Anton Kovac", "Milan Novak", "anton.kovac.demo@fightops.ai", "Croatia", "Orthodox", "Heavyweight", "human-escalation"],
  ["Liam O'Connor", "Sean Doyle", "liam.oconnor.demo@fightops.ai", "Ireland", "Southpaw", "Lightweight", "ready"],
  ["Tariq Aziz", "Samir Khan", "tariq.aziz.demo@fightops.ai", "Pakistan", "Orthodox", "Lightweight", "ai-handling"],
  ["Noah Berg", "Anders Holm", "noah.berg.demo@fightops.ai", "Norway", "Switch", "Welterweight", "ready"],
  ["Felipe Ramos", "Carlos Mendes", "felipe.ramos.demo@fightops.ai", "Portugal", "Orthodox", "Welterweight", "processing"],
  ["Marco Silva", "Rui Santos", "marco.silva.demo@fightops.ai", "Portugal", "Orthodox", "Lightweight", "ready"],
  ["Tariq Hassan", "Yasir Malik", "tariq.hassan.demo@fightops.ai", "Morocco", "Southpaw", "Lightweight", "ai-handling"],
  ["Santiago Vega", "Pablo Cruz", "santiago.vega.demo@fightops.ai", "Spain", "Orthodox", "Featherweight", "ready"],
  ["Ivan Petrov", "Dmitri Volkov", "ivan.petrov.demo@fightops.ai", "Bulgaria", "Orthodox", "Featherweight", "processing"],
  ["Kenji Sato", "Haru Ito", "kenji.sato.demo@fightops.ai", "Japan", "Switch", "Bantamweight", "ready"],
  ["Amir Rahman", "Bilal Noor", "amir.rahman.demo@fightops.ai", "Egypt", "Orthodox", "Bantamweight", "ai-handling"],
  ["Dylan Brooks", "Ryan Hayes", "dylan.brooks.demo@fightops.ai", "United States", "Southpaw", "Middleweight", "ready"],
  ["Mehdi Karimi", "Reza Farah", "mehdi.karimi.demo@fightops.ai", "Iran", "Orthodox", "Middleweight", "processing"],
];

const fightPairs = [
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 7],
  [8, 9],
  [10, 11],
  [12, 13],
  [14, 15],
  [16, 17],
  [18, 19],
  [20, 21],
  [22, 23],
];

await mongoose.connect(databaseUrl, { dbName: databaseName });

try {
  const db = mongoose.connection.db;
  const collections = {
    users: db.collection("users"),
    events: db.collection("events"),
    fighters: db.collection("fighters"),
    fights: db.collection("fights"),
    eventRequirements: db.collection("eventrequirements"),
    fighterRequirements: db.collection("fighterrequirements"),
    readiness: db.collection("fightereventreadinesses"),
    reminders: db.collection("reminderlogs"),
    submissions: db.collection("documentsubmissions"),
  };

  const ownerUser = await ensureOwnerUser(collections.users);
  await clearExistingDemo(collections);

  const now = new Date();
  const eventDate = new Date("2026-09-20T15:00:00.000Z");
  const event = await insertOne(collections.events, {
    slug: eventSlug,
    createdByUserId: ownerUser._id,
    name: "Desert Clash 14",
    date: eventDate,
    location: "Coca-Cola Arena, Dubai",
    status: "upcoming",
    note: "Seeded demo event for FightOps AI prototype validation.",
    createdAt: now,
    updatedAt: now,
  });

  const eventRequirements = await Promise.all(
    requirementTemplates.map((template, index) =>
      insertOne(collections.eventRequirements, {
        eventId: event._id,
        category: template.category,
        name: template.name,
        description: template.description,
        inputType: "document",
        required: true,
        priority: template.priority,
        dueDate: calculateEventRequirementDueDate(template, eventDate, now),
        dueAnchor: template.dueAnchor,
        dueOffsetDays: template.dueOffsetDays,
        reminderEnabled: true,
        reminderCadence: "daily_until_resolved",
        reminderDaysBeforeDue: template.reminderDaysBeforeDue,
        reminderSubject: "{{requirementName}} needed for {{eventName}}",
        reminderMessage: "Please submit {{requirementName}} for {{fighterName}} before {{dueDate}}. You have {{daysRemaining}} day(s) remaining.",
        structuredFields: [],
        documentBlocks: [
          {
            key: template.key,
            title: template.name,
            description: template.description,
            required: true,
            acceptedFileTypes: template.acceptedFileTypes,
            humanVerificationRequired: template.humanVerificationRequired,
            sortOrder: 1,
          },
        ],
        humanVerificationRequired: template.humanVerificationRequired,
        isSignedAgreement: template.isSignedAgreement,
        acceptedFileTypes: template.acceptedFileTypes,
        sortOrder: index + 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
    ),
  );
  const fighterDocs = await Promise.all(
    fighters.map(([fullName, managerName, managerEmail, nationality, stance, division, scenario]) =>
      insertOne(collections.fighters, {
        userId: null,
        fullName,
        nationality,
        stance,
        division,
        managerName,
        managerEmail,
        managerPhone: "+971 50 123 4567",
        photoUrl: null,
        contractReference: `DCL14-${slugCode(fullName)}`,
        inviteStatus: scenario === "ready" ? "accepted" : "pending",
        inviteSentAt: new Date("2026-08-20T09:00:00.000Z"),
        inviteAcceptedAt:
          scenario === "ready" ? new Date("2026-08-21T10:30:00.000Z") : null,
        createdAt: now,
        updatedAt: now,
      }),
    ),
  );

  const fightDocs = await Promise.all(
    fightPairs.map(([fighterAIndex, fighterBIndex], index) => {
      const fighterA = fighterDocs[fighterAIndex];
      const fighterB = fighterDocs[fighterBIndex];
      const readiness = Math.round(
        (scenarioReadiness(fighters[fighterAIndex][6]) +
          scenarioReadiness(fighters[fighterBIndex][6])) /
          2,
      );

      return insertOne(collections.fights, {
        eventId: event._id,
        order: index + 1,
        division: fighterA.division,
        fighterAId: fighterA._id,
        fighterBId: fighterB._id,
        status: readiness === 100 ? "READY" : readiness < 50 ? "HUMAN_ACTION" : "PROCESSING",
        readinessPercentage: readiness,
        createdAt: now,
        updatedAt: now,
      });
    }),
  );

  const fightByFighterId = new Map();
  for (const fight of fightDocs) {
    fightByFighterId.set(fight.fighterAId.toString(), {
      fightId: fight._id,
      opponentFighterId: fight.fighterBId,
    });
    fightByFighterId.set(fight.fighterBId.toString(), {
      fightId: fight._id,
      opponentFighterId: fight.fighterAId,
    });
  }

  for (const [index, fighter] of fighterDocs.entries()) {
    const scenario = fighters[index][6];
    const fightLink = fightByFighterId.get(fighter._id.toString());
    const createdRequirements = [];

    for (const [requirementIndex, eventRequirement] of eventRequirements.entries()) {
      const template = requirementTemplates[requirementIndex];
      const status = requirementStatusForScenario(scenario, template.key);
      const dueDate = calculateFighterDueDate(
        template,
        eventDate,
        fighter.inviteAcceptedAt,
      );
      const reminderSchedule = buildSeedReminderSchedule({
        status,
        dueDate,
        eventRequirement,
        now,
      });
      const fighterRequirement = await insertOne(collections.fighterRequirements, {
        eventId: event._id,
        fighterId: fighter._id,
        fightId: fightLink?.fightId ?? null,
        eventRequirementId: eventRequirement._id,
        status,
        required: true,
        priority: eventRequirement.priority,
        dueDate,
        humanVerificationRequired: eventRequirement.humanVerificationRequired,
        overrideReason: status === "NEEDS_RESUBMISSION" ? "Uploaded file was incomplete." : null,
        aiConfidence: status === "HUMAN_ACTION" ? confidenceForFighter(fighter.fullName) : null,
        aiReason:
          status === "HUMAN_ACTION"
            ? humanActionReasonForRequirement(template.name, fighter.fullName)
            : null,
        latestSubmissionId: null,
        completedAt:
          status === "ACCEPTED" || status === "NOT_APPLICABLE"
            ? new Date("2026-08-24T11:00:00.000Z")
            : null,
        ...reminderSchedule,
        createdAt: now,
        updatedAt: now,
      });

      const submission = await maybeCreateSubmission({
        collections,
        event,
        fighter,
        eventRequirement,
        fighterRequirement,
        status,
        now,
      });

      if (submission) {
        await collections.fighterRequirements.updateOne(
          { _id: fighterRequirement._id },
          { $set: { latestSubmissionId: submission._id } },
        );
      }

      if (["WAITING", "NEEDS_RESUBMISSION"].includes(status)) {
        await createReminderHistory({
          collections,
          event,
          fighter,
          fightId: fightLink?.fightId ?? null,
          eventRequirement,
          dueDate,
          now,
        });
      }

      createdRequirements.push({ ...fighterRequirement, status });
    }

    await insertOne(collections.readiness, {
      eventId: event._id,
      fighterId: fighter._id,
      fightId: fightLink?.fightId ?? null,
      opponentFighterId: fightLink?.opponentFighterId ?? null,
      readinessPercentage: scenarioReadiness(scenario),
      status: scenarioReadinessStatus(scenario),
      nextAction: scenarioNextAction(scenario),
      createdAt: now,
      updatedAt: now,
    });
  }

  console.log("FightOps AI demo seed complete.");
  console.log(`Event: ${event.name} (${event.slug})`);
  console.log(`Owner: ${ownerUser.email}`);
  console.log(`Fighters: ${fighterDocs.length}`);
  console.log(`Fights: ${fightDocs.length}`);
  console.log(`Requirements per fighter: ${eventRequirements.length}`);
  console.log(`Demo fallback login: demo-promoter@fightops.ai / ${demoPassword}`);
} finally {
  await mongoose.disconnect();
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function ensureOwnerUser(users) {
  const existingPromoter = await users.findOne({
    role: "promoter",
    status: "active",
  });

  if (existingPromoter) {
    return existingPromoter;
  }

  const now = new Date();
  const existingDemo = await users.findOne({ email: "demo-promoter@fightops.ai" });

  if (existingDemo) {
    await users.updateOne(
      { _id: existingDemo._id },
      {
        $set: {
          role: "promoter",
          status: "active",
          emailVerifiedAt: now,
          updatedAt: now,
        },
      },
    );
    return users.findOne({ _id: existingDemo._id });
  }

  const inserted = await insertOne(users, {
    email: "demo-promoter@fightops.ai",
    role: "promoter",
    provider: "credentials",
    status: "active",
    emailVerifiedAt: now,
    passwordHash: hashPassword(demoPassword),
    profile: {
      firstName: "Demo",
      lastName: "Promoter",
      displayName: "Demo Promoter",
    },
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  });

  return inserted;
}

async function clearExistingDemo(collections) {
  const existingEvent = await collections.events.findOne({ slug: eventSlug });

  if (!existingEvent) {
    await collections.fighters.deleteMany({
      managerEmail: { $regex: "\\.demo@fightops\\.ai$" },
    });
    return;
  }

  const fights = await collections.fights
    .find({ eventId: existingEvent._id })
    .project({ fighterAId: 1, fighterBId: 1 })
    .toArray();
  const fighterIds = Array.from(
    new Set(
      fights
        .flatMap((fight) => [fight.fighterAId, fight.fighterBId])
        .filter(Boolean)
        .map((id) => id.toString()),
    ),
  ).map((id) => new mongoose.Types.ObjectId(id));

  await Promise.all([
    collections.submissions.deleteMany({ eventId: existingEvent._id }),
    collections.reminders.deleteMany({ eventId: existingEvent._id }),
    collections.readiness.deleteMany({ eventId: existingEvent._id }),
    collections.fighterRequirements.deleteMany({ eventId: existingEvent._id }),
    collections.eventRequirements.deleteMany({ eventId: existingEvent._id }),
    collections.fights.deleteMany({ eventId: existingEvent._id }),
    collections.events.deleteOne({ _id: existingEvent._id }),
  ]);

  if (fighterIds.length > 0) {
    await collections.fighters.deleteMany({ _id: { $in: fighterIds } });
  }
}

async function insertOne(collection, doc) {
  const result = await collection.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

function calculateEventRequirementDueDate(template, eventDate, now) {
  if (template.dueAnchor === "before_event") {
    return addDays(eventDate, -template.dueOffsetDays);
  }

  if (template.dueAnchor === "after_fight_scheduled") {
    return addDays(now, template.dueOffsetDays);
  }

  return null;
}

function calculateFighterDueDate(template, eventDate, inviteAcceptedAt) {
  if (template.dueAnchor === "before_event") {
    return addDays(eventDate, -template.dueOffsetDays);
  }

  if (template.dueAnchor === "after_invite_accepted") {
    return addDays(inviteAcceptedAt ?? new Date("2026-08-21T00:00:00.000Z"), template.dueOffsetDays);
  }

  if (template.dueAnchor === "after_signed_agreement_approved") {
    return addDays(new Date("2026-08-24T11:00:00.000Z"), template.dueOffsetDays);
  }

  return null;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function requirementStatusForScenario(scenario, requirementKey) {
  if (scenario === "ready") {
    return "ACCEPTED";
  }

  if (scenario === "human-escalation") {
    if (["passport-id", "medical-clearance"].includes(requirementKey)) {
      return "HUMAN_ACTION";
    }

    if (["travel-information", "accommodation-details"].includes(requirementKey)) {
      return "WAITING";
    }

    return "ACCEPTED";
  }

  if (scenario === "ai-handling") {
    if (requirementKey === "signed-agreement") {
      return "ACCEPTED";
    }

    if (["passport-id", "media-headshot"].includes(requirementKey)) {
      return "ACCEPTED";
    }

    if (["medical-clearance", "travel-information", "visa-information"].includes(requirementKey)) {
      return "WAITING";
    }

    return "PROCESSING";
  }

  if (scenario === "processing") {
    if (["signed-agreement", "passport-id", "media-headshot"].includes(requirementKey)) {
      return "ACCEPTED";
    }

    if (requirementKey === "insurance-certificate") {
      return "RECEIVED";
    }

    if (requirementKey === "weight-confirmation") {
      return "NEEDS_RESUBMISSION";
    }

    return "WAITING";
  }

  return "WAITING";
}

async function maybeCreateSubmission({
  collections,
  event,
  fighter,
  eventRequirement,
  fighterRequirement,
  status,
  now,
}) {
  if (!["ACCEPTED", "RECEIVED", "PROCESSING", "NEEDS_RESUBMISSION"].includes(status)) {
    return null;
  }

  const submissionStatus =
    status === "ACCEPTED"
      ? "ACCEPTED"
      : status === "NEEDS_RESUBMISSION"
        ? "REJECTED"
        : "PENDING_REVIEW";
  const safeFighter = slugCode(fighter.fullName).toLowerCase();
  const safeRequirement = slugCode(eventRequirement.name).toLowerCase();

  return insertOne(collections.submissions, {
    eventId: event._id,
    fighterId: fighter._id,
    fightId: fighterRequirement.fightId,
    eventRequirementId: eventRequirement._id,
    fighterRequirementId: fighterRequirement._id,
    uploadedByUserId: event.createdByUserId,
    originalFileName: `${safeRequirement}_${safeFighter}.pdf`,
    mimeType: "application/pdf",
    sizeBytes: 1_800_000,
    storageProvider: "local",
    storageKey: `demo/${event.slug}/${safeFighter}/${safeRequirement}.pdf`,
    publicUrl: null,
    status: submissionStatus,
    reviewNote:
      submissionStatus === "REJECTED"
        ? "Document needs a clearer upload before approval."
        : null,
    reviewedByUserId: submissionStatus === "PENDING_REVIEW" ? null : event.createdByUserId,
    reviewedAt: submissionStatus === "PENDING_REVIEW" ? null : now,
    createdAt: new Date("2026-08-24T09:15:00.000Z"),
    updatedAt: now,
  });
}

async function createReminderHistory({
  collections,
  event,
  fighter,
  fightId,
  eventRequirement,
  dueDate,
  now,
}) {
  if (!dueDate) {
    return;
  }

  const scheduledFor = addDays(dueDate, -2);
  await collections.reminders.updateOne(
    {
      eventId: event._id,
      fighterId: fighter._id,
      eventRequirementId: eventRequirement._id,
      kind: "fighter_reminder",
      scheduledFor,
    },
    {
      $setOnInsert: {
        eventId: event._id,
        fighterId: fighter._id,
        fightId,
        eventRequirementId: eventRequirement._id,
        kind: "fighter_reminder",
        recipientName: fighter.managerName,
        recipientEmail: fighter.managerEmail,
        requirementName: eventRequirement.name,
        eventName: event.name,
        scheduledFor,
        dueDate,
        subject: `${event.name}: ${eventRequirement.name} reminder`,
        message: `Please submit ${eventRequirement.name} for ${fighter.fullName} before ${dueDate.toISOString().slice(0, 10)}.`,
        status: "SENT",
        sentAt: scheduledFor,
        attemptCount: 1,
        lastError: null,
        nextAttemptAt: null,
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true },
  );
}

function buildSeedReminderSchedule({ status, dueDate, eventRequirement, now }) {
  if (!["WAITING", "NEEDS_RESUBMISSION"].includes(status) || !dueDate) {
    return {
      nextReminderAt: null,
      lastReminderAt: null,
      reminderAttemptCount: 0,
      reminderLockedUntil: null,
      reminderClaimToken: null,
      nextDeadlineAlertAt: null,
      deadlineAlertSentAt: null,
      deadlineAlertAttemptCount: 0,
      reminderStoppedReason: `status_${status.toLowerCase()}`,
    };
  }

  const reminderStart = addDays(
    dueDate,
    -(eventRequirement.reminderDaysBeforeDue?.[0] ?? 0),
  );
  const nextReminderAt = reminderStart > now ? reminderStart : now;
  const nextDeadlineAlertAt = new Date(
    Date.UTC(
      dueDate.getUTCFullYear(),
      dueDate.getUTCMonth(),
      dueDate.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );

  return {
    nextReminderAt,
    lastReminderAt: null,
    reminderAttemptCount: 0,
    reminderLockedUntil: null,
    reminderClaimToken: null,
    nextDeadlineAlertAt,
    deadlineAlertSentAt: null,
    deadlineAlertAttemptCount: 0,
    reminderStoppedReason: null,
  };
}

function scenarioReadiness(scenario) {
  if (scenario === "ready") {
    return 100;
  }

  if (scenario === "human-escalation") {
    return 58;
  }

  if (scenario === "ai-handling") {
    return 55;
  }

  return 44;
}

function scenarioReadinessStatus(scenario) {
  if (scenario === "ready") {
    return "READY";
  }

  if (scenario === "human-escalation") {
    return "HUMAN_ACTION";
  }

  if (scenario === "ai-handling") {
    return "PROCESSING";
  }

  return "WAITING";
}

function scenarioNextAction(scenario) {
  if (scenario === "ready") {
    return "All mandatory requirements resolved.";
  }

  if (scenario === "human-escalation") {
    return "Manual review required before FightOps AI can continue.";
  }

  if (scenario === "ai-handling") {
    return "FightOps AI is following up on missing operational items.";
  }

  return "Waiting for fighter team response.";
}

function confidenceForFighter(name) {
  const digest = createHash("sha256").update(name).digest("hex");
  return 45 + (Number.parseInt(digest.slice(0, 2), 16) % 20);
}

function humanActionReasonForRequirement(requirementName, fighterName) {
  if (requirementName === "Passport / ID") {
    return `Passport details do not confidently match ${fighterName}'s fighter record.`;
  }

  return `${requirementName} could not be safely approved automatically.`;
}

function slugCode(value) {
  return value
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
}
