# FightOps / MMA Finds
## Backend Implementation and Frontend Integration Plan

Last updated: 2026-08-30

---

## 1. Purpose

This document converts the approved product direction, current UI implementation, and readiness architecture into a developer execution plan.

It is intended to help the team implement the smallest clean end-to-end backend for Fighter Operations AI without drifting away from the PRD.

This document should be used as the implementation source of truth for:

- backend domain modeling
- API planning
- frontend integration order
- readiness calculation behavior
- agent/developer consistency

---

## 2. Current Project State

### Already implemented

- Auth UI and backend
- Session handling and role-based dashboard routing
- Promoter dashboard UI for:
  - Overview
  - Events
  - Create Event
  - Event Detail / Fight Card
  - Edit Fight Card
  - Add Fight
  - Fight Detail
  - Human Action
  - Activity / Audit
  - Documents
  - Settings

### Current limitation

Most promoter workspace screens are still powered by mock data in:

`src/features/dashboard/data/promoter-events.ts`

This means the UI direction is strong, but the operational product is not yet truly functional.

---

## 3. Core Product Rule

This project must remain event-centric.

The central rule is:

```text
CONFIGURE ONCE:
Event Checklist

TRACK INDIVIDUALLY:
Event + Fighter Requirement Status

DERIVE:
Fighter Readiness
  -> Fight Readiness
  -> Event Readiness
```

That means:

- the promoter configures requirements at the event level
- each fighter gets event-specific requirement instances
- fight readiness is derived from both fighters
- event readiness is derived from all fighters or fights

Do not introduce:

- global fighter readiness
- fight-specific master checklists
- permanent participant accounts for MVP
- a global Fighters module for MVP

---

## 4. Recommended Folder Structure

Use the existing backend pattern already present for auth.

```text
src/
  app/
    api/
      v1/
        auth/
        events/
        fights/
        fighters/
        requirements/
        documents/
        human-action/
        audit/
        participants/
  features/
    dashboard/
      components/
      lib/
      types/
    participant/
      components/
      lib/
      types/
  server/
    config/
    db/
    models/
    repositories/
    services/
    validators/
    security/
```

### Rule for future work

- models only define schema and persistence shape
- repositories only read/write data
- services own business logic
- validators own input validation
- API routes stay thin
- readiness calculation must live in one central service only

---

## 5. Domain Model

## 5.1 Event

```ts
type EventStatus = "draft" | "upcoming" | "active" | "completed";

type Event = {
  id: string;
  organizationId?: string;
  createdByUserId: string;
  name: string;
  date: string;
  location: string;
  status: EventStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
};
```

## 5.2 Fight

```ts
type Fight = {
  id: string;
  eventId: string;
  order: number;
  division: string;
  fighterAId: string;
  fighterBId: string;
  status: "READY" | "WAITING" | "HUMAN_ACTION" | "PROCESSING";
  readinessPercentage: number;
  createdAt: string;
  updatedAt: string;
};
```

## 5.3 Fighter

This is not a permanent full CRM for MVP. It is a lightweight operational identity record.

```ts
type Fighter = {
  id: string;
  fullName: string;
  nationality?: string;
  stance?: string;
  division?: string;
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
};
```

## 5.4 Event Requirement

```ts
type RequirementPriority = "critical" | "high" | "medium" | "low";

type EventRequirementInputType =
  | "document"
  | "text"
  | "date"
  | "number"
  | "choice"
  | "confirmation";

type EventRequirement = {
  id: string;
  eventId: string;
  category: string;
  name: string;
  description?: string;
  inputType: EventRequirementInputType;
  required: boolean;
  priority: RequirementPriority;
  dueDate?: string;
  reminderEnabled: boolean;
  reminderDaysBeforeDue: number[];
  humanVerificationRequired: boolean;
  isSignedAgreement: boolean;
  acceptedFileTypes: string[];
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
```

## 5.5 Fighter Event Readiness

```ts
type ReadinessStatus =
  | "READY"
  | "WAITING"
  | "HUMAN_ACTION"
  | "PROCESSING";

type FighterEventReadiness = {
  id: string;
  eventId: string;
  fighterId: string;
  fightId?: string;
  opponentFighterId?: string;
  readinessPercentage: number;
  status: ReadinessStatus;
  nextAction?: string;
  createdAt: string;
  updatedAt: string;
};
```

## 5.6 Fighter Requirement

```ts
type FighterRequirementStatus =
  | "WAITING"
  | "PROCESSING"
  | "RECEIVED"
  | "ACCEPTED"
  | "NEEDS_RESUBMISSION"
  | "HUMAN_ACTION"
  | "NOT_APPLICABLE";

type FighterRequirement = {
  id: string;
  eventId: string;
  fighterId: string;
  fightId?: string;
  eventRequirementId: string;
  status: FighterRequirementStatus;
  required: boolean;
  priority: RequirementPriority;
  dueDate?: string;
  humanVerificationRequired: boolean;
  overrideReason?: string;
  aiConfidence?: number;
  aiReason?: string;
  latestSubmissionId?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};
```

## 5.7 Requirement Submission

```ts
type SubmissionProcessingStatus =
  | "UPLOADED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

type SubmissionReviewStatus =
  | "RECEIVED"
  | "ACCEPTED"
  | "HUMAN_ACTION"
  | "NEEDS_RESUBMISSION";

type RequirementSubmission = {
  id: string;
  fighterRequirementId: string;
  submittedByType: "fighter" | "manager" | "promoter" | "admin";
  submittedByLabel: string;
  documentId?: string;
  submittedAt: string;
  processingStatus: SubmissionProcessingStatus;
  aiConfidence?: number;
  aiResult?: Record<string, unknown>;
  reviewStatus?: SubmissionReviewStatus;
  createdAt: string;
  updatedAt: string;
};
```

## 5.8 Document

```ts
type Document = {
  id: string;
  eventId: string;
  fighterId?: string;
  fightId?: string;
  eventRequirementId?: string;
  fighterRequirementId?: string;
  submissionId?: string;
  fileName: string;
  fileType: string;
  fileSizeInBytes: number;
  storagePath: string;
  uploadedByType: "fighter" | "manager" | "promoter" | "admin" | "ai";
  uploadedByLabel: string;
  status: "received" | "processing" | "accepted" | "rejected" | "archived";
  createdAt: string;
  updatedAt: string;
};
```

## 5.9 Human Action Case

```ts
type HumanActionCaseStatus = "open" | "resolved" | "rejected";

type HumanActionCase = {
  id: string;
  eventId: string;
  fightId?: string;
  fighterId: string;
  fighterRequirementId: string;
  documentId?: string;
  priority: RequirementPriority;
  reason: string;
  aiConfidence?: number;
  aiRecommendation?: string;
  status: HumanActionCaseStatus;
  resolution?: string;
  resolvedByUserId?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
};
```

## 5.10 Audit Log

```ts
type AuditActorType = "ai" | "promoter" | "admin" | "fighter" | "manager" | "system";

type AuditLog = {
  id: string;
  eventId?: string;
  fightId?: string;
  fighterId?: string;
  fighterRequirementId?: string;
  documentId?: string;
  humanActionCaseId?: string;
  actorType: AuditActorType;
  actorLabel: string;
  action: string;
  previousState?: string;
  newState?: string;
  reason?: string;
  aiConfidence?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
};
```

## 5.11 Participant Access Token

```ts
type ParticipantAccess = {
  id: string;
  eventId: string;
  fighterId: string;
  fightId?: string;
  email: string;
  tokenHash: string;
  expiresAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
  createdAt: string;
};
```

---

## 6. Persistence Files To Create

Recommended initial files:

```text
src/server/models/event.model.ts
src/server/models/fight.model.ts
src/server/models/fighter.model.ts
src/server/models/event-requirement.model.ts
src/server/models/fighter-event-readiness.model.ts
src/server/models/fighter-requirement.model.ts
src/server/models/requirement-submission.model.ts
src/server/models/document.model.ts
src/server/models/human-action-case.model.ts
src/server/models/audit-log.model.ts
src/server/models/participant-access.model.ts
```

---

## 7. Repository Layer

Repositories should remain small and focused.

Recommended repository files:

```text
src/server/repositories/events.repository.ts
src/server/repositories/fights.repository.ts
src/server/repositories/fighters.repository.ts
src/server/repositories/event-requirements.repository.ts
src/server/repositories/fighter-readiness.repository.ts
src/server/repositories/fighter-requirements.repository.ts
src/server/repositories/submissions.repository.ts
src/server/repositories/documents.repository.ts
src/server/repositories/human-action.repository.ts
src/server/repositories/audit.repository.ts
src/server/repositories/participant-access.repository.ts
```

Repository rules:

- no readiness calculation here
- no redirect logic here
- no response formatting here
- only database access and mapping

---

## 8. Service Layer

Recommended services:

```text
src/server/services/events.service.ts
src/server/services/fights.service.ts
src/server/services/fighters.service.ts
src/server/services/event-requirements.service.ts
src/server/services/fighter-readiness.service.ts
src/server/services/submissions.service.ts
src/server/services/documents.service.ts
src/server/services/human-action.service.ts
src/server/services/audit.service.ts
src/server/services/participant.service.ts
src/server/services/readiness.service.ts
```

### Most important service

`readiness.service.ts` must be the single source of truth for:

- fighter readiness recalculation
- fight readiness recalculation
- event readiness recalculation

Do not duplicate status logic in:

- API routes
- UI mapping
- repositories
- background jobs

---

## 9. Readiness Rules

### 9.1 Fighter readiness

Mandatory requirements only should block READY.

Complete if:

- `ACCEPTED`
- `NOT_APPLICABLE`

Status precedence:

```text
HUMAN_ACTION
PROCESSING
WAITING
READY
```

### 9.2 Fight readiness

Derived from both fighters.

Rules:

- if either fighter is `HUMAN_ACTION` -> fight is `HUMAN_ACTION`
- if both are `READY` -> fight is `READY`
- if either is `PROCESSING` -> fight is `PROCESSING`
- otherwise -> fight is `WAITING`

### 9.3 Event readiness

Derived from event fighters or fights.

For MVP:

- store aggregate counts
- store percentage
- derive summary state from unresolved blocking requirements

---

## 10. API Contract

Use thin route handlers under `src/app/api/v1`.

## 10.1 Events

```text
GET    /api/v1/events
POST   /api/v1/events
GET    /api/v1/events/:eventId
PATCH  /api/v1/events/:eventId
DELETE /api/v1/events/:eventId
```

## 10.2 Fights

```text
GET    /api/v1/events/:eventId/fights
POST   /api/v1/events/:eventId/fights
GET    /api/v1/events/:eventId/fights/:fightId
PATCH  /api/v1/events/:eventId/fights/:fightId
DELETE /api/v1/events/:eventId/fights/:fightId
PATCH  /api/v1/events/:eventId/fights/reorder
```

## 10.3 Event Requirements

```text
GET    /api/v1/events/:eventId/requirements
POST   /api/v1/events/:eventId/requirements
PATCH  /api/v1/events/:eventId/requirements/:requirementId
DELETE /api/v1/events/:eventId/requirements/:requirementId
```

## 10.4 Fighters

```text
GET    /api/v1/events/:eventId/fighters
POST   /api/v1/events/:eventId/fighters
GET    /api/v1/events/:eventId/fighters/:fighterId
PATCH  /api/v1/events/:eventId/fighters/:fighterId
```

## 10.5 Fighter Readiness

```text
GET /api/v1/events/:eventId/fighters/:fighterId/readiness
```

Response should include:

- fighter profile
- fight context
- readiness summary
- grouped requirements
- latest submission info
- AI signals
- next action

## 10.6 Fighter Requirement Actions

```text
PATCH /api/v1/events/:eventId/fighters/:fighterId/requirements/:fighterRequirementId
```

Allowed actions:

- `mark_not_applicable`
- `request_resubmission`
- `override_accept`
- `override_reject`
- `escalate_human_action`
- `resolve_human_action`

## 10.7 Submissions

```text
POST /api/v1/fighter-requirements/:fighterRequirementId/submissions
GET  /api/v1/fighter-requirements/:fighterRequirementId/submissions
```

## 10.8 Documents

```text
GET    /api/v1/documents
GET    /api/v1/documents/:documentId
DELETE /api/v1/documents/:documentId
```

Recommended filters:

- eventId
- fighterId
- type
- status
- priority
- query

## 10.9 Human Action

```text
GET   /api/v1/human-action
GET   /api/v1/human-action/:caseId
PATCH /api/v1/human-action/:caseId
```

## 10.10 Audit

```text
GET /api/v1/audit
GET /api/v1/events/:eventId/audit
```

## 10.11 Participant

```text
POST /api/v1/participants/access/request
GET  /api/v1/participants/:token
POST /api/v1/participants/:token/submissions
GET  /api/v1/participants/:token/questions
POST /api/v1/participants/:token/questions
```

---

## 11. Required System Behaviors

## 11.1 When an event is created

- create event record only
- no fighter requirements yet

## 11.2 When a fight is created

- create missing fighter records if needed
- create fight record
- create or ensure fighter event readiness records
- load active event requirements
- create fighter requirement instances for both fighters if missing
- recalculate both fighters
- recalculate fight
- recalculate event

## 11.3 When a new event requirement is added

- create `EventRequirement`
- create `FighterRequirement` for all active event fighters
- recalculate affected fighters
- recalculate related fights
- recalculate event

## 11.4 When an event requirement is edited

Safe to propagate to unresolved fighter requirements:

- priority
- due date
- description
- reminder settings
- category

Needs caution:

- required to optional
- optional to required
- human verification flag
- deletion

## 11.5 When a submission is uploaded

Flow:

```text
WAITING
-> PROCESSING
-> ACCEPTED
```

or:

```text
WAITING
-> PROCESSING
-> HUMAN_ACTION
```

or:

```text
WAITING
-> PROCESSING
-> NEEDS_RESUBMISSION
```

After every state change:

- write audit log
- recalculate fighter
- recalculate fight
- recalculate event

## 11.6 When a human action case is resolved

- update related fighter requirement
- mark case resolved
- write audit entry
- recalculate fighter
- recalculate fight
- recalculate event

---

## 12. Frontend Integration Strategy

Current dashboard is mock-driven.

We should replace mocks in a controlled order.

## Phase A - core event data

Replace:

- overview cards
- events list
- create event form
- event detail header

## Phase B - fight card data

Replace:

- event fights
- edit fight card
- add fight
- fight detail header

## Phase C - checklist and readiness

Add:

- event checklist configuration page
- fighter readiness detail page
- real readiness summaries in event and fight screens

## Phase D - documents and submissions

Replace:

- documents storage page
- upload flows
- requirement submission states

## Phase E - human action and audit

Replace:

- human action queue
- human action case detail
- activity / audit page

## Phase F - participant experience

Build:

- participant secure landing page
- requirement detail submission page
- processing state
- event Q&A
- READY state

---

## 13. Missing Screens That Must Still Be Built

These are still missing or only partial relative to the PRD:

- Event Required Documents / Checklist Configuration
- Add Requirement / Edit Requirement modal or page
- Event Knowledge / FAQ Configuration
- Communications / AI Follow-Up View
- Participant secure landing page
- Participant requirement submission page
- AI processing feedback screen
- Event Q&A screen
- Participant READY screen

---

## 14. DTO Layer Recommendation

Do not bind React directly to raw Mongo shapes.

Create UI-facing response mappers for:

- `EventSummaryDto`
- `EventDetailDto`
- `FightCardDto`
- `FighterReadinessDto`
- `RequirementRowDto`
- `DocumentRowDto`
- `HumanActionCaseDto`
- `AuditLogRowDto`
- `ParticipantChecklistDto`

Suggested location:

```text
src/features/dashboard/lib/
src/features/participant/lib/
src/server/services/* presenter helpers
```

---

## 15. Testing Plan

Minimum backend tests must cover:

- fighter readiness calculation
- fight readiness calculation
- event readiness aggregation
- event requirement propagation to fighters
- per-fighter override behavior
- human action resolution flow
- submission state transitions
- signed agreement special-case display data

Recommended test files:

```text
src/server/services/__tests__/readiness.service.test.ts
src/server/services/__tests__/event-requirements.service.test.ts
src/server/services/__tests__/human-action.service.test.ts
src/server/services/__tests__/submissions.service.test.ts
```

---

## 16. Suggested Implementation Order

This is the recommended delivery order for the team.

### Phase 1

- Event model
- Fight model
- Fighter model
- Event CRUD
- Fight CRUD

### Phase 2

- EventRequirement model
- FighterEventReadiness model
- FighterRequirement model
- readiness service

### Phase 3

- requirement propagation when fights/fighters are added
- requirement propagation when a new event requirement is created

### Phase 4

- event checklist APIs
- event checklist UI

### Phase 5

- fighter readiness API
- fighter readiness UI
- integrate derived statuses into fight card and overview

### Phase 6

- submission model
- document model
- upload API
- document storage integration

### Phase 7

- human action backend
- human action integration

### Phase 8

- audit backend
- activity / audit integration

### Phase 9

- participant secure token flow
- participant checklist and submission flow

### Phase 10

- Event Knowledge
- Communications / AI follow-up

---

## 17. Developer / Agent Working Rules

Every developer or agent working on this code should follow these rules:

1. Reuse existing structure before adding new patterns.
2. Keep API routes thin.
3. Put business logic in services, not components.
4. Never duplicate readiness logic.
5. Never update the event master requirement when changing one fighter.
6. Prefer small end-to-end slices over large disconnected rewrites.
7. Add test coverage for every readiness rule change.
8. Update DTOs and mock replacements gradually, not all at once.
9. Keep participant flow token-based, not account-based.
10. Preserve PRD terminology exactly:
   - READY
   - WAITING
   - HUMAN ACTION
   - PROCESSING
   - RECEIVED
   - NEEDS RESUBMISSION
   - NOT APPLICABLE

---

## 18. Immediate Next Implementation Slice

The best next slice is:

### Slice 1

- implement `Event`, `Fight`, `Fighter`
- add real event CRUD
- add real fight CRUD
- wire Overview, Events, Create Event, and Event Detail to API

### Then Slice 2

- implement `EventRequirement`, `FighterRequirement`, `FighterEventReadiness`
- build `readiness.service.ts`
- add event checklist configuration page

This gives the product a real data backbone before we connect documents and human review.

---

## 19. Final Summary

The UI now gives us a strong visual shell.

The backend must now be implemented around one strict rule:

```text
Event configures the checklist.
Each fighter tracks their own event-specific progress.
Fight status is derived.
Event status is derived.
```

If we keep that rule intact, the rest of the product will stay clean, predictable, and aligned with both the PRD and the existing dashboard design work.
