import { existsSync, readFileSync } from "node:fs";
import mongoose from "mongoose";

loadEnvFile(".env");

const databaseUrl = process.env.DATABASE_URL;
const databaseName = process.env.DATABASE_NAME || "fightops";
const eventSlug = "desert-clash-14";

if (!databaseUrl) {
  fail("DATABASE_URL is not configured.");
}

await mongoose.connect(databaseUrl, { dbName: databaseName });

try {
  const db = mongoose.connection.db;
  const users = db.collection("users");
  const events = db.collection("events");
  const fights = db.collection("fights");
  const fighters = db.collection("fighters");
  const eventRequirements = db.collection("eventrequirements");
  const fighterRequirements = db.collection("fighterrequirements");
  const readiness = db.collection("fightereventreadinesses");
  const reminders = db.collection("reminderlogs");
  const submissions = db.collection("documentsubmissions");

  const event = await events.findOne({ slug: eventSlug });

  if (!event) {
    fail(`Demo event '${eventSlug}' was not found. Run npm run seed:demo first.`);
  }

  const owner = await users.findOne({ _id: event.createdByUserId });
  const admin = await users.findOne({ role: "admin", status: "active" });
  const eventId = event._id;
  const eventIdString = eventId.toString();

  assert(owner?.role === "promoter", "Demo event owner must be an active promoter.");
  assert(Boolean(admin), "At least one active admin account is required.");

  const [eventFightDocs, eventRequirementDocs, eventFighterRequirementDocs, eventReadinessDocs, eventReminderDocs, eventSubmissionDocs] = await Promise.all([
    fights.find({ eventId }).toArray(),
    eventRequirements.find({ eventId }).toArray(),
    fighterRequirements.find({ eventId }).toArray(),
    readiness.find({ eventId }).toArray(),
    reminders.find({ eventId }).toArray(),
    submissions.find({ eventId }).toArray(),
  ]);

  assert(eventFightDocs.length > 0, "Demo event must contain at least one fight.");
  assert(eventRequirementDocs.length > 0, "Demo event must contain requirements.");
  assert(eventFighterRequirementDocs.length > 0, "Demo event must contain fighter requirements.");
  assert(eventReadinessDocs.length > 0, "Demo event must contain readiness records.");

  const fighterIds = uniqueIds(eventFightDocs.flatMap((fight) => [fight.fighterAId, fight.fighterBId]));
  const fighterDocs = await fighters.find({ _id: { $in: fighterIds } }).toArray();
  const fighterIdSet = new Set(fighterDocs.map((fighter) => fighter._id.toString()));
  const eventRequirementIdSet = new Set(eventRequirementDocs.map((requirement) => requirement._id.toString()));
  const fightIdSet = new Set(eventFightDocs.map((fight) => fight._id.toString()));
  const fighterRequirementIdSet = new Set(eventFighterRequirementDocs.map((requirement) => requirement._id.toString()));

  assert(fighterDocs.length === fighterIds.length, "Every assigned fight fighter must exist.");

  for (const fight of eventFightDocs) {
    assert(!fight.fighterAId || fighterIdSet.has(fight.fighterAId.toString()), `Fight ${fight._id} has a missing Fighter A.`);
    assert(!fight.fighterBId || fighterIdSet.has(fight.fighterBId.toString()), `Fight ${fight._id} has a missing Fighter B.`);
  }

  const requirementKeys = new Set();
  for (const requirement of eventFighterRequirementDocs) {
    assert(fighterIdSet.has(requirement.fighterId.toString()), `Requirement ${requirement._id} has a missing fighter.`);
    assert(eventRequirementIdSet.has(requirement.eventRequirementId.toString()), `Requirement ${requirement._id} has a missing event requirement.`);
    assert(!requirement.fightId || fightIdSet.has(requirement.fightId.toString()), `Requirement ${requirement._id} has a missing fight.`);

    const key = `${requirement.fighterId}:${requirement.eventRequirementId}`;
    assert(!requirementKeys.has(key), `Duplicate fighter requirement found for ${key}.`);
    requirementKeys.add(key);
  }

  for (const record of eventReadinessDocs) {
    assert(fighterIdSet.has(record.fighterId.toString()), `Readiness ${record._id} has a missing fighter.`);
    assert(!record.fightId || fightIdSet.has(record.fightId.toString()), `Readiness ${record._id} has a missing fight.`);
  }

  for (const submission of eventSubmissionDocs) {
    assert(fighterIdSet.has(submission.fighterId.toString()), `Submission ${submission._id} has a missing fighter.`);
    assert(eventRequirementIdSet.has(submission.eventRequirementId.toString()), `Submission ${submission._id} has a missing event requirement.`);
    assert(fighterRequirementIdSet.has(submission.fighterRequirementId.toString()), `Submission ${submission._id} has a missing fighter requirement.`);
  }

  for (const reminder of eventReminderDocs) {
    assert(fighterIdSet.has(reminder.fighterId.toString()), `Reminder ${reminder._id} has a missing fighter.`);
    assert(eventRequirementIdSet.has(reminder.eventRequirementId.toString()), `Reminder ${reminder._id} has a missing event requirement.`);
    assert(["fighter_reminder", "deadline_alert"].includes(reminder.kind ?? "fighter_reminder"), `Reminder ${reminder._id} has an invalid kind.`);
  }

  console.log("Demo data verification passed.");
  console.log(`Event: ${event.name} (${eventIdString})`);
  console.log(`Active admin accounts: ${await users.countDocuments({ role: "admin", status: "active" })}`);
  console.log(`Fights: ${eventFightDocs.length}`);
  console.log(`Fighters: ${fighterDocs.length}`);
  console.log(`Requirements: ${eventRequirementDocs.length} templates, ${eventFighterRequirementDocs.length} fighter assignments`);
  console.log(`Readiness records: ${eventReadinessDocs.length}`);
  console.log(`Documents: ${eventSubmissionDocs.length}`);
  console.log(`Reminder logs: ${eventReminderDocs.length}`);
} finally {
  await mongoose.disconnect();
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function uniqueIds(values) {
  return Array.from(
    new Map(
      values
        .filter(Boolean)
        .map((value) => [value.toString(), value]),
    ).values(),
  );
}

function fail(message) {
  console.error(`Demo data verification failed: ${message}`);
  process.exit(1);
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
