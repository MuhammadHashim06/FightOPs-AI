# FightOps / MMA Finds — Event Checklist & Fighter Readiness Architecture

## Purpose

Implement the document / requirement configuration model for the MMA Finds Fighter Operations AI product.

This specification converts the PRD requirements into a developer-ready implementation model for Codex.

The key design decision is:

> **Requirements are configured at the Event level, instantiated and tracked separately for each Fighter, while Fight and Event readiness are derived from fighter readiness.**

This keeps the product event-centric, avoids duplicating configuration for every fight, and matches the PRD's requirement that fighter readiness is an event-specific operational record rather than a permanent global fighter profile.

---

# 1. Core Architecture Decision

Use the following ownership model:

```text
Configuration ownership:
EVENT

Execution / completion ownership:
EVENT + FIGHTER

Derived readiness:
FIGHT
EVENT
```

In practical terms:

```text
Event
│
├── Required Documents / Checklist Configuration
│   ├── Passport
│   ├── Medical Certificate
│   ├── Blood Test
│   ├── Signed Agreement
│   ├── Fighter Photo
│   └── Travel Information
│
├── Fight 1
│   ├── Fighter A
│   │   └── Event-specific checklist instance
│   └── Fighter B
│       └── Event-specific checklist instance
│
├── Fight 2
│   ├── Fighter C
│   │   └── Event-specific checklist instance
│   └── Fighter D
│       └── Event-specific checklist instance
│
└── ...
```

Do **not** make the primary checklist configuration fight-specific.

Do **not** make the checklist a permanent fighter-profile configuration.

The event defines what is required.

Each fighter receives their own event-specific copy/state of those requirements.

---

# 2. Why Event-Level Configuration

The PRD defines an explicit:

**Event Required Documents / Checklist Configuration**

Its purpose is to let the promoter define what fighters need in order to become READY.

The promoter must be able to configure:

- Requirement type/category
- Item name
- Required vs optional
- Priority
- Due date
- Reminder setting
- Human verification flag
- Signed agreement requirement
- Event post reminder configuration

This means the reusable checklist belongs to the event.

Example:

```text
Event: MMA London 2026

Required Fighter Checklist

1. Passport
   Required: Yes
   Priority: Critical
   Due Date: 10 Sep

2. Medical Certificate
   Required: Yes
   Priority: Critical
   Due Date: 12 Sep
   Human Verification: Yes

3. Signed Fight Agreement
   Required: Yes
   Priority: High
   Due Date: 8 Sep

4. Fighter Photo
   Required: No
   Priority: Medium

5. Travel Information
   Required: Yes
   Priority: Medium
```

Once configured, these requirements should become available for every fighter participating in that event.

---

# 3. Fighter-Level Requirement Instances

Every fighter participating in the event must have an independent readiness record.

The fighter does not edit the master event checklist.

Instead, the system creates or resolves a fighter-specific requirement instance from the event requirement.

Example:

```text
Event Requirement:
Passport

Fighter A:
Passport = ACCEPTED

Fighter B:
Passport = WAITING

Fighter C:
Passport = NEEDS_RESUBMISSION

Fighter D:
Passport = NOT_APPLICABLE
```

The event-level requirement definition remains shared.

The fighter-specific record stores the current operational state.

---

# 4. Recommended Domain Model

This section is a recommended implementation interpretation of the PRD.

## 4.1 Event

```ts
type Event = {
  id: string;
  name: string;
  date: string;
  location: string;
  status?: "draft" | "upcoming" | "active" | "completed";
};
```

---

## 4.2 Event Requirement Definition

Represents one requirement configured by the promoter for an event.

```ts
type EventRequirement = {
  id: string;
  eventId: string;

  category: string;
  name: string;
  description?: string;

  inputType:
    | "document"
    | "text"
    | "date"
    | "number"
    | "choice"
    | "confirmation";

  required: boolean;

  priority:
    | "critical"
    | "high"
    | "medium"
    | "low";

  dueDate?: string;

  reminderEnabled: boolean;
  reminderConfig?: {
    daysBeforeDue?: number[];
  };

  humanVerificationRequired: boolean;

  isSignedAgreement: boolean;

  acceptedFileTypes?: string[];

  sortOrder: number;

  createdAt: string;
  updatedAt: string;
};
```

Important:

- This belongs to `eventId`.
- It should not belong directly to a fight.
- It should not belong to a permanent fighter profile.

---

# 5. Fighter Event Readiness Record

Each fighter must have an event-specific readiness record.

Recommended shape:

```ts
type FighterEventReadiness = {
  id: string;

  eventId: string;
  fighterId: string;

  fightId?: string;
  opponentFighterId?: string;

  readinessPercentage: number;

  status:
    | "READY"
    | "WAITING"
    | "HUMAN_ACTION"
    | "PROCESSING";

  nextAction?: string;

  createdAt: string;
  updatedAt: string;
};
```

This record must be scoped to:

```text
fighter + event
```

Not just:

```text
fighter
```

A fighter can participate in another event later and have a completely different checklist and readiness state.

---

# 6. Fighter Requirement Instance

Recommended implementation:

```ts
type FighterRequirement = {
  id: string;

  eventId: string;
  eventRequirementId: string;

  fighterId: string;
  fightId?: string;

  status:
    | "WAITING"
    | "PROCESSING"
    | "RECEIVED"
    | "ACCEPTED"
    | "NEEDS_RESUBMISSION"
    | "HUMAN_ACTION"
    | "NOT_APPLICABLE";

  required: boolean;
  priority: "critical" | "high" | "medium" | "low";

  dueDate?: string;

  overrideReason?: string;

  aiConfidence?: number;
  aiReason?: string;

  humanVerificationRequired: boolean;

  latestSubmissionId?: string;

  completedAt?: string;

  createdAt: string;
  updatedAt: string;
};
```

The fighter requirement instance is where the actual operational work happens.

---

# 7. Per-Fighter Overrides

The promoter must be able to override a requirement for an individual fighter.

Examples:

```text
Event Requirement:
Medical Clearance = Required

Fighter A:
Required

Fighter B:
Required

Fighter C:
NOT APPLICABLE
Reason: Commission exemption confirmed
```

Recommended supported overrides:

```text
Mark NOT_APPLICABLE
Mark requirement resolved
Re-open requirement
Request resubmission
Override AI decision
Escalate to HUMAN_ACTION
```

Do not mutate the master event requirement when performing a fighter-specific override.

Bad:

```text
Promoter marks Fighter C Medical as N/A
=> Medical becomes N/A for everyone
```

Correct:

```text
Promoter marks Fighter C Medical as N/A
=> Only Fighter C's requirement instance changes
```

---

# 8. Requirement Status Model

Use the PRD's core operational terminology.

## READY

All mandatory fighter requirements are satisfied.

## WAITING

Something is still outstanding from the fighter/manager or routine progress is pending.

## HUMAN_ACTION

AI cannot safely continue without staff input.

## PROCESSING

AI is currently reading, classifying, extracting or updating.

## RECEIVED

The item has been received but is not finally resolved yet.

## NEEDS_RESUBMISSION

The submitted item was rejected, incomplete or unusable.

## NOT_APPLICABLE

The requirement does not apply to this specific fighter.

---

# 9. Requirement Completion Logic

A fighter requirement should count as complete when:

```text
status = ACCEPTED
```

or:

```text
status = NOT_APPLICABLE
```

if the system permits N/A for that requirement.

Optional requirements should not block READY.

Pseudo-code:

```ts
function isBlockingRequirement(
  requirement: FighterRequirement
): boolean {
  if (!requirement.required) {
    return false;
  }

  return ![
    "ACCEPTED",
    "NOT_APPLICABLE"
  ].includes(requirement.status);
}
```

---

# 10. Fighter Readiness Calculation

The fighter is READY when all mandatory requirements are resolved.

Pseudo-code:

```ts
function calculateFighterStatus(
  requirements: FighterRequirement[]
) {
  const mandatory = requirements.filter(r => r.required);

  const hasHumanAction = mandatory.some(
    r => r.status === "HUMAN_ACTION"
  );

  if (hasHumanAction) {
    return "HUMAN_ACTION";
  }

  const hasProcessing = mandatory.some(
    r => r.status === "PROCESSING"
  );

  const unresolved = mandatory.filter(
    r =>
      !["ACCEPTED", "NOT_APPLICABLE"].includes(r.status)
  );

  if (unresolved.length === 0) {
    return "READY";
  }

  if (hasProcessing) {
    return "PROCESSING";
  }

  return "WAITING";
}
```

Recommended readiness percentage:

```ts
function calculateReadinessPercentage(
  requirements: FighterRequirement[]
) {
  const mandatory = requirements.filter(r => r.required);

  if (mandatory.length === 0) {
    return 100;
  }

  const resolved = mandatory.filter(r =>
    ["ACCEPTED", "NOT_APPLICABLE"].includes(r.status)
  );

  return Math.round(
    (resolved.length / mandatory.length) * 100
  );
}
```

---

# 11. Fight Readiness

The fight itself should not own another independent checklist.

Its readiness should be derived from Fighter A and Fighter B.

Example:

```text
Fight 1

Fighter A = READY
Fighter B = WAITING

Fight = WAITING
```

When both become ready:

```text
Fighter A = READY
Fighter B = READY

Fight = READY
```

Recommended logic:

```ts
function calculateFightStatus(
  fighterAStatus: string,
  fighterBStatus: string
) {
  if (
    fighterAStatus === "HUMAN_ACTION" ||
    fighterBStatus === "HUMAN_ACTION"
  ) {
    return "HUMAN_ACTION";
  }

  if (
    fighterAStatus === "READY" &&
    fighterBStatus === "READY"
  ) {
    return "READY";
  }

  if (
    fighterAStatus === "PROCESSING" ||
    fighterBStatus === "PROCESSING"
  ) {
    return "PROCESSING";
  }

  return "WAITING";
}
```

---

# 12. Event Readiness

Event readiness should aggregate fighter and/or fight readiness.

Example:

```text
Event
12 Fights
24 Fighters

READY Fighters: 18
WAITING Fighters: 4
HUMAN ACTION Fighters: 2
```

Possible event-level display:

```text
Clearance incomplete
75%
WAITING
```

Recommended event status precedence:

```text
If any important unresolved HUMAN_ACTION exists:
    HUMAN_ACTION

Else if every mandatory fighter record is READY:
    READY

Else:
    WAITING
```

The exact event percentage formula can be implemented using resolved mandatory fighter requirements across the event.

---

# 13. Fight Card UI

Each fight card must show the fighters independently.

Example:

```text
Fight 03
Lightweight

Ahmed Khan                 John Smith
READY                      WAITING
100%                       72%

                           Missing:
                           - Medical Certificate
                           - Signed Agreement
```

Fight-level badge:

```text
Fight Status: WAITING
```

Clicking a fighter opens:

```text
Event-specific Fighter Readiness Detail
```

Do not open a generic global fighter CRM profile.

---

# 14. Event Required Documents UI

Recommended route:

```text
/events/:eventId/requirements
```

or:

```text
/events/:eventId/checklist
```

Page title:

```text
Required Documents & Checklist
```

This is the master event configuration screen.

Recommended table:

| Requirement | Category | Required | Priority | Due Date | Verification | Reminder | Actions |
|---|---|---|---|---|---|---|---|
| Passport | Identity | Yes | Critical | Sep 10 | AI + Human fallback | On | Edit |
| Medical Certificate | Medical | Yes | Critical | Sep 12 | Human | On | Edit |
| Signed Agreement | Contract | Yes | High | Sep 8 | Review | On | Edit |
| Fighter Photo | Media | No | Medium | — | AI | Off | Edit |

Actions:

```text
Add Requirement
Edit
Delete
Toggle Required
Set Priority
Set Due Date
Configure Reminder
Set Human Verification
Mark as Signed Agreement requirement
Save
```

The checklist ordering is only visual.

Do not enforce sequential submission.

---

# 15. Add Requirement Form

Recommended fields:

```text
Requirement Name *
Category *
Description / Instructions

Input Type
- Document upload
- Text
- Date
- Number
- Choice
- Confirmation

Required
[ ] Required for READY

Priority
- Critical
- High
- Medium
- Low

Due Date

Reminder
[ ] Enable reminder

Verification
[ ] Human verification required

Special Type
[ ] Signed Agreement / Contract

Accepted File Types
PDF
JPG
PNG
etc.
```

---

# 16. Fighter Readiness Detail UI

Recommended route:

```text
/events/:eventId/fighters/:fighterId
```

Header:

```text
Ahmed Khan
vs John Smith

Readiness: 68%
Status: WAITING

Manager:
David Khan

Next Action:
Medical certificate required by Sep 12
```

Requirement groups may include:

```text
Identity
Medical
Contracts
Travel
Media
Event Information
Other
```

Each row should show:

```text
Requirement name
Priority
Required / Optional
Due date
Current status
Latest document
AI confidence
Next action
```

Example:

```text
Medical Certificate
CRITICAL
Required
Due Sep 12

Status:
HUMAN ACTION

AI:
Expiry date appears to be 2 days before event.
Confidence: 84%

Action:
Review Medical Document
```

---

# 17. Signed Agreement Flow

Signed Agreement is a normal event requirement with specialized presentation.

Example definition:

```text
Name:
Signed Fight Agreement

Category:
Contract

Required:
Yes

Priority:
High

Special type:
Signed Agreement
```

Fighter states:

```text
NOT SUBMITTED
RECEIVED
UNDER REVIEW
ACCEPTED
NEEDS RESUBMISSION
```

Participant flow:

```text
Open secure event page
→ Open Signed Agreement
→ Upload signed agreement
→ Processing
→ Received
→ Review
→ Accepted
```

If rejected:

```text
NEEDS RESUBMISSION
→ Participant receives request
→ Upload replacement
```

---

# 18. Document Storage

Documents should be browsed hierarchically:

```text
Event
  → Fighter
    → Documents
```

Do not make document storage fight-first.

Recommended fields:

```text
File Name
Document Type
Requirement
Fighter
Fight
Date
Requirement Priority
Status
AI Confidence
```

Recommended route:

```text
/documents
```

with filters:

```text
Event
Fighter
Type
Status
Priority
```

---

# 19. Human Action Queue

A human-review case may reference:

```text
Event
Fight
Fighter
Requirement
Document
```

Example:

```text
Priority:
High

Event:
MMA London 2026

Fight:
Ahmed Khan vs John Smith

Fighter:
Ahmed Khan

Requirement:
Medical Certificate

Reason:
Medical expiry date may be invalid for event date.

AI Confidence:
62%

Recommendation:
Manual review required.
```

Actions:

```text
Approve
Correct
Reject
Request Resubmission
Mark N/A
Resolve
Contact Participant
```

---

# 20. Participant / Fighter Secure Page

For the MVP, the fighter or manager uses a secure event-specific link.

Do not require permanent account creation.

Recommended route concept:

```text
/participant/:secureToken
```

Show:

```text
Event
Fighter
Opponent
Readiness Percentage
Completed Requirements
Missing Requirements
High Priority Requirements
Upload CTA
Help / Event Q&A
```

High-priority requirements should appear first.

Do not hide lower-priority mandatory requirements.

---

# 21. Participant Checklist Example

```text
Ahmed Khan
MMA London 2026

Readiness
68%

URGENT

[ ] Medical Certificate
    CRITICAL
    Due Sep 12

[ ] Signed Fight Agreement
    HIGH
    Due Sep 8

OTHER REQUIREMENTS

[x] Passport
    Accepted

[x] Fighter Photo
    Accepted

[ ] Travel Details
    MEDIUM
    Due Sep 15
```

The participant may submit requirements in any order.

---

# 22. Requirement Submission Flow

```text
Participant opens requirement

→ Sees:
  - Name
  - Priority
  - Instructions
  - Due date
  - Accepted input/file type
  - Current status

→ Uploads file / enters information

→ System sets status:
  PROCESSING

→ AI processes submission

→ Possible outcomes:

  ACCEPTED
  RECEIVED / awaiting final review
  HUMAN_ACTION
  NEEDS_RESUBMISSION
  Unsupported
  Processing Error
```

---

# 23. AI Processing Rules

When AI affects an operational state, expose:

```text
1. What AI detected
2. What data/state changed
3. Confidence or reason
4. What happens next
```

Example:

```text
AI detected:
Passport

Extracted:
Name: Ahmed Khan
Passport No: XXXXX
Expiry: 18 Feb 2028

Confidence:
97%

Action:
Passport requirement marked ACCEPTED.

Next:
Medical Certificate still required.
```

Low confidence example:

```text
AI detected:
Medical Certificate

Issue:
Expiry date may conflict with event requirements.

Confidence:
61%

Action:
Escalated to HUMAN ACTION.
```

---

# 24. Requirement Creation / Synchronization Rules

When a new fighter is added to an event:

```text
1. Create fighter event readiness record.
2. Load all event requirement definitions.
3. Create fighter requirement instances.
4. Set default state:
   WAITING
5. Optional requirements may also start as WAITING
   but must not block READY.
6. Calculate fighter readiness.
7. Recalculate fight readiness.
8. Recalculate event readiness.
```

---

# 25. Adding a New Requirement After Fighters Already Exist

If the promoter adds a new requirement after fighters have already been added:

```text
Event has 20 fighters.

Promoter adds:
Visa Document
Required = Yes
```

System must create a corresponding fighter requirement instance for all active fighters in the event.

Recommended transaction:

```text
Create EventRequirement

For each event fighter:
    Create FighterRequirement

Recalculate:
    Fighter readiness
    Fight readiness
    Event readiness
```

---

# 26. Editing an Existing Event Requirement

If promoter changes:

```text
Priority
Due Date
Reminder
Instructions
Required/Optional
```

the system should propagate configurable definition fields to unresolved fighter instances.

Be careful with historical records.

Recommended behavior:

### Safe to propagate automatically

```text
Priority
Due Date
Instructions
Reminder
Display Category
```

### Needs careful handling

```text
Required -> Optional
Optional -> Required
Human Verification Requirement
Requirement deletion
```

Any such update must trigger readiness recalculation.

---

# 27. Deleting an Event Requirement

Do not hard-delete fighter history if submissions already exist.

Recommended behavior:

```text
If no submissions exist:
    allow deletion

If submissions/history exist:
    archive/deactivate requirement
```

Existing audit records should remain inspectable.

---

# 28. Recommended Database Structure

Names can be adapted to the existing project.

```text
events

fights
- id
- event_id
- fighter_a_id
- fighter_b_id
- sort_order

event_requirements
- id
- event_id
- category
- name
- description
- input_type
- is_required
- priority
- due_date
- reminder_enabled
- human_verification_required
- is_signed_agreement
- sort_order
- is_active

fighter_event_readiness
- id
- event_id
- fighter_id
- fight_id
- readiness_percentage
- status
- next_action

fighter_requirements
- id
- event_id
- fighter_id
- fight_id
- event_requirement_id
- status
- is_required
- priority
- due_date
- human_verification_required
- override_reason
- ai_confidence
- ai_reason
- latest_submission_id
- completed_at

requirement_submissions
- id
- fighter_requirement_id
- file_id
- submitted_by
- submitted_at
- processing_status
- ai_confidence
- ai_result
- review_status

documents
- id
- event_id
- fighter_id
- requirement_id
- submission_id
- file_name
- file_type
- storage_path
- status

human_action_cases
- id
- event_id
- fight_id
- fighter_id
- fighter_requirement_id
- document_id
- priority
- reason
- ai_confidence
- ai_recommendation
- status

audit_logs
- id
- event_id
- fighter_id
- requirement_id
- actor_type
- action
- previous_state
- new_state
- reason
- created_at
```

---

# 29. API / Service Responsibilities

Suggested service boundaries.

## Event Requirements

```text
GET    /events/:eventId/requirements
POST   /events/:eventId/requirements
PATCH  /events/:eventId/requirements/:requirementId
DELETE /events/:eventId/requirements/:requirementId
```

## Fighter Readiness

```text
GET /events/:eventId/fighters/:fighterId/readiness
```

## Fighter Requirement

```text
PATCH /events/:eventId/fighters/:fighterId/requirements/:id
```

Actions can include:

```text
mark-not-applicable
request-resubmission
override
resolve
escalate
```

## Submission

```text
POST /fighter-requirements/:id/submissions
```

## Human Action

```text
GET   /human-action
GET   /human-action/:caseId
PATCH /human-action/:caseId
```

Exact API style can be adapted to the existing backend.

---

# 30. Recalculation Service

Create one central readiness service.

Example:

```ts
ReadinessService.recalculateFighter({
  eventId,
  fighterId
});

ReadinessService.recalculateFight({
  eventId,
  fightId
});

ReadinessService.recalculateEvent({
  eventId
});
```

After any requirement state change:

```text
Requirement changed
    ↓
Recalculate fighter
    ↓
Recalculate fight
    ↓
Recalculate event
```

Do not duplicate readiness calculation logic across controllers/components.

---

# 31. Recommended Status Precedence

For fighter and fight summary state:

```text
HUMAN_ACTION
    ↓
PROCESSING
    ↓
WAITING
    ↓
READY
```

Meaning:

If any blocking requirement requires human action:

```text
Fighter = HUMAN_ACTION
```

Otherwise if something is processing:

```text
Fighter = PROCESSING
```

Otherwise if mandatory items are missing:

```text
Fighter = WAITING
```

Otherwise:

```text
Fighter = READY
```

---

# 32. UI Navigation

Promoter navigation should remain event-centric.

Recommended:

```text
Overview

Events
  → Event Overview
  → Fight Card
  → Fighter Readiness
  → Required Documents

Human Action

Documents

Activity / Audit

Settings
```

Do not create a global:

```text
Fighters
```

module for this MVP.

Fighters must be accessed contextually from their event / fight card.

---

# 33. What Must NOT Be Implemented

Do not introduce:

```text
Global fighter document checklist
Permanent fighter profile readiness
Fight-specific duplicate checklist configuration
Checklist sequence enforcement
Fighter discovery
Matchmaking
Permanent fighter/manager accounts
Advanced medical eligibility engine
Automated social posting
WhatsApp-first workflow
Electronic signature execution
```

unless another project requirement explicitly adds them.

---

# 34. Event Post Reminder

Event Post Reminder is different from fighter document requirements.

It belongs to the event as an operational reminder.

Example:

```text
Event:
MMA London 2026

Post Reminder:
Fight Card Announcement

Due:
Sep 14

Status:
Upcoming
```

Do not create this as a fighter document.

Do not interpret it as automatic social publishing.

---

# 35. Example Full Workflow

## Step 1 — Promoter Creates Event

```text
MMA London 2026
September 25
London
```

## Step 2 — Promoter Configures Checklist

```text
Passport
Medical
Signed Agreement
Photo
Travel Information
```

## Step 3 — Promoter Builds Fight Card

```text
Fight 1
Ahmed Khan vs John Smith

Fight 2
Carlos Mendes vs Ryan Hall
```

## Step 4 — System Creates Fighter Checklist Instances

```text
Ahmed
  Passport WAITING
  Medical WAITING
  Contract WAITING
  Photo WAITING
  Travel WAITING

John
  Passport WAITING
  Medical WAITING
  Contract WAITING
  Photo WAITING
  Travel WAITING
```

## Step 5 — Fighter Submits Passport

```text
WAITING
→ PROCESSING
→ ACCEPTED
```

Readiness recalculates.

## Step 6 — Medical Submission Has Low Confidence

```text
PROCESSING
→ HUMAN_ACTION
```

Fighter:

```text
HUMAN_ACTION
```

Fight:

```text
HUMAN_ACTION
```

Event aggregate updates.

## Step 7 — Promoter Resolves Case

```text
Approve Medical
```

Medical:

```text
ACCEPTED
```

Fighter readiness recalculates.

## Step 8 — All Mandatory Requirements Complete

```text
Fighter:
READY
```

When both fighters are READY:

```text
Fight:
READY
```

When every mandatory event fighter requirement is resolved:

```text
Event:
READY
```

---

# 36. Acceptance Criteria

The implementation is complete when all of the following are true.

## Configuration

- Promoter can configure requirements once for an event.
- Event requirements support required/optional.
- Event requirements support Critical/High/Medium/Low priority.
- Event requirements support due dates.
- Event requirements support reminders.
- Event requirements support human-verification flags.
- Signed Agreement can be configured as a requirement.

## Fighter Tracking

- Every event fighter has an independent checklist state.
- One fighter's status change does not modify another fighter.
- Fighter readiness is event-specific.
- Fighter requirements support NOT_APPLICABLE.
- Promoter can manually override or resolve a fighter requirement.
- Optional requirements do not block READY.

## Fight Readiness

- Fight readiness derives from both fighters.
- No separate duplicate fight checklist is required.
- Fight becomes READY only when both fighters are READY.
- Human Action is surfaced at fight level when either fighter requires it.

## Event Readiness

- Event overview shows Ready / Waiting / Human Action counts.
- Event readiness updates when fighter readiness changes.
- Event percentage updates automatically.

## Documents

- Documents are browsable Event → Fighter → Documents.
- Each document is linked to its requirement.
- Requirement priority is visible where relevant.
- Signed agreement status is visible.

## Participant

- Fighter/manager sees only their event-specific requirements.
- Secure event page works without permanent account creation.
- High-priority missing requirements are surfaced first.
- Participant can submit items in any order.

## AI

- AI processing exposes detected information.
- AI exposes the state/data change.
- Confidence/reason is visible where relevant.
- Low-confidence/sensitive cases can escalate to HUMAN_ACTION.

## Audit

- Requirement state changes are auditable.
- AI actions and human overrides are distinguishable.
- Previous and new states can be inspected.

---

# 37. Codex Implementation Instruction

Use this section as the direct instruction for Codex.

```text
Implement the Fighter Operations checklist/readiness architecture according to this document.

Before modifying code:

1. Inspect the existing project structure.
2. Identify current Event, Fight, Fighter, Document, AI processing and status models.
3. Reuse existing architecture and naming where possible.
4. Do not create duplicate systems if equivalent models/services already exist.
5. Identify required database migrations.
6. Identify backend/API changes.
7. Identify frontend routes/components/state changes.
8. Implement the smallest coherent end-to-end version first.

Core rule:

- Checklist configuration belongs to EVENT.
- Requirement completion/status belongs to EVENT + FIGHTER.
- Fight status is derived from Fighter A + Fighter B.
- Event readiness is derived from fighter/fight readiness.
- A fighter requirement may be individually overridden or marked NOT_APPLICABLE.
- Never mutate the event master requirement when changing one fighter's status.

Maintain the PRD terminology:

READY
WAITING
HUMAN ACTION
PROCESSING
RECEIVED
NEEDS RESUBMISSION
NOT APPLICABLE

Do not create a permanent global fighter readiness profile.
Do not create a separate checklist configuration for every fight.
Do not add a global "By Fighters" module for the MVP.

After implementation:

1. Run migrations.
2. Run type checks.
3. Run linting.
4. Run tests.
5. Add/update tests for readiness calculations.
6. Verify event checklist propagation to fighters.
7. Verify per-fighter overrides.
8. Verify fight and event recalculation.
9. Verify participant submission flow.
10. Report every file changed and any unresolved assumptions.
```

---

# 38. Suggested Implementation Order

Codex should preferably implement in this order:

```text
Phase 1
Event requirement model / migration

Phase 2
Fighter event readiness + fighter requirement instances

Phase 3
Requirement synchronization when fighters are added

Phase 4
Readiness calculation service

Phase 5
Promoter Event Checklist UI

Phase 6
Fighter Readiness UI

Phase 7
Fight Card readiness integration

Phase 8
Event Overview aggregates

Phase 9
Participant secure checklist

Phase 10
Document / submission integration

Phase 11
Human Action integration

Phase 12
Audit trail + tests
```

---

# 39. Source Alignment

This implementation model is based on the MMA Finds Fighter Operations AI Designer PRD, especially:

- Product is event-centric and fight-card-centric.
- Fighter details are contextual to an event/fight card.
- Fighter Readiness Detail is an event-specific readiness record.
- Event Required Documents / Checklist Configuration defines what fighters need to become READY.
- Event/Fight Card shows Fighter A and Fighter B with individual readiness statuses.
- Documents are browsed Event → Fighter → Documents.
- Participants may submit requirements in any order.
- NOT APPLICABLE is an explicit requirement state.
- Signed Agreement is supported as a required submission.
- Event Post Reminder is an event-level operational reminder, not a fighter document.
- Permanent fighter/manager profile systems are outside MVP scope.

---

# 40. Final Rule Summary

```text
CONFIGURE ONCE:
Event Checklist

TRACK INDIVIDUALLY:
Fighter Requirement Status

DERIVE:
Fighter Readiness
    ↓
Fight Readiness
    ↓
Event Readiness
```

This must remain the central architecture unless a future confirmed business requirement explicitly changes the model.
