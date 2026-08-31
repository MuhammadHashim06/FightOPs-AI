export type RequirementPriority = "critical" | "high" | "medium" | "low";

export type RequirementDueAnchor =
  | "custom_date"
  | "before_event"
  | "after_fight_scheduled"
  | "after_invite_accepted"
  | "after_signed_agreement_approved";

export type RequirementReminderCadence =
  | "daily_until_resolved"
  | "once_before_due"
  | "off";

export type EventRequirementInputType =
  | "document"
  | "text"
  | "date"
  | "number"
  | "choice"
  | "confirmation";

export type RequirementStructuredFieldType =
  | "text"
  | "date"
  | "time"
  | "email"
  | "number";

export type RequirementStructuredField = {
  key: string;
  label: string;
  type: RequirementStructuredFieldType;
  required: boolean;
  placeholder: string | null;
};

export type RequirementDocumentBlock = {
  key: string;
  title: string;
  description: string | null;
  required: boolean;
  acceptedFileTypes: string[];
  humanVerificationRequired: boolean;
  sortOrder: number;
};

export type EventRequirementRecord = {
  id: string;
  eventId: string;
  category: string;
  name: string;
  description: string | null;
  inputType: EventRequirementInputType;
  required: boolean;
  priority: RequirementPriority;
  dueDate: string | null;
  dueAnchor: RequirementDueAnchor;
  dueOffsetDays: number | null;
  reminderEnabled: boolean;
  reminderCadence: RequirementReminderCadence;
  reminderDaysBeforeDue: number[];
  reminderSubject: string | null;
  reminderMessage: string | null;
  structuredFields: RequirementStructuredField[];
  documentBlocks: RequirementDocumentBlock[];
  humanVerificationRequired: boolean;
  isSignedAgreement: boolean;
  acceptedFileTypes: string[];
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateEventRequirementInput = {
  category: string;
  name: string;
  description?: string;
  inputType: EventRequirementInputType;
  required: boolean;
  priority: RequirementPriority;
  dueDate?: string;
  dueAnchor?: RequirementDueAnchor;
  dueOffsetDays?: number;
  reminderEnabled?: boolean;
  reminderCadence?: RequirementReminderCadence;
  reminderDaysBeforeDue?: number[];
  reminderSubject?: string;
  reminderMessage?: string;
  structuredFields?: RequirementStructuredField[];
  documentBlocks?: RequirementDocumentBlock[];
  humanVerificationRequired?: boolean;
  isSignedAgreement?: boolean;
  acceptedFileTypes?: string[];
  sortOrder?: number;
};

export type RequirementTemplateRecord = {
  id: string;
  ownerUserId: string;
  category: string;
  name: string;
  description: string | null;
  inputType: EventRequirementInputType;
  required: boolean;
  priority: RequirementPriority;
  dueDaysBeforeEvent: number | null;
  dueAnchor: RequirementDueAnchor;
  dueOffsetDays: number | null;
  reminderEnabled: boolean;
  reminderCadence: RequirementReminderCadence;
  reminderDaysBeforeDue: number[];
  reminderSubject: string | null;
  reminderMessage: string | null;
  structuredFields: RequirementStructuredField[];
  documentBlocks: RequirementDocumentBlock[];
  humanVerificationRequired: boolean;
  isSignedAgreement: boolean;
  acceptedFileTypes: string[];
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateRequirementTemplateInput = {
  category: string;
  name: string;
  description?: string;
  inputType: EventRequirementInputType;
  required: boolean;
  priority: RequirementPriority;
  dueDaysBeforeEvent?: number;
  dueAnchor?: RequirementDueAnchor;
  dueOffsetDays?: number;
  reminderEnabled?: boolean;
  reminderCadence?: RequirementReminderCadence;
  reminderDaysBeforeDue?: number[];
  reminderSubject?: string;
  reminderMessage?: string;
  structuredFields?: RequirementStructuredField[];
  documentBlocks?: RequirementDocumentBlock[];
  humanVerificationRequired?: boolean;
  isSignedAgreement?: boolean;
  acceptedFileTypes?: string[];
  sortOrder?: number;
};

export type UpdateRequirementTemplateInput =
  Partial<CreateRequirementTemplateInput> & {
    isActive?: boolean;
  };

export type ReminderLogStatus = "PENDING" | "SENT" | "SKIPPED" | "FAILED";

export type ReminderLogRecord = {
  id: string;
  eventId: string;
  fighterId: string;
  fightId: string | null;
  eventRequirementId: string;
  recipientName: string;
  recipientEmail: string;
  requirementName: string;
  eventName: string;
  scheduledFor: string;
  dueDate: string | null;
  subject: string;
  message: string;
  status: ReminderLogStatus;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentSubmissionStatus =
  | "PENDING_REVIEW"
  | "ACCEPTED"
  | "REJECTED";

export type DocumentSubmissionRecord = {
  id: string;
  eventId: string;
  fighterId: string;
  fightId: string | null;
  eventRequirementId: string;
  fighterRequirementId: string;
  uploadedByUserId: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  storageProvider: "local" | "r2";
  storageKey: string;
  publicUrl: string | null;
  status: DocumentSubmissionStatus;
  reviewNote: string | null;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FighterRequirementStatus =
  | "WAITING"
  | "PROCESSING"
  | "RECEIVED"
  | "ACCEPTED"
  | "NEEDS_RESUBMISSION"
  | "HUMAN_ACTION"
  | "NOT_APPLICABLE";

export type FighterRequirementRecord = {
  id: string;
  eventId: string;
  fighterId: string;
  fightId: string | null;
  eventRequirementId: string;
  status: FighterRequirementStatus;
  required: boolean;
  priority: RequirementPriority;
  dueDate: string | null;
  humanVerificationRequired: boolean;
  overrideReason: string | null;
  aiConfidence: number | null;
  aiReason: string | null;
  latestSubmissionId: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReadinessStatus =
  | "READY"
  | "WAITING"
  | "HUMAN_ACTION"
  | "PROCESSING";

export type FighterEventReadinessRecord = {
  id: string;
  eventId: string;
  fighterId: string;
  fightId: string | null;
  opponentFighterId: string | null;
  readinessPercentage: number;
  status: ReadinessStatus;
  nextAction: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FighterReadinessDetail = {
  readiness: FighterEventReadinessRecord;
  requirements: FighterRequirementRecord[];
};
