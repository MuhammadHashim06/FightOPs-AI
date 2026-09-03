export type HumanActionPriority = "critical" | "high" | "medium" | "low";

export type HumanActionCaseSummary = {
  id: string;
  eventSlug: string;
  eventName: string;
  fighterName: string;
  reason: string;
  requirement: string;
  priority: HumanActionPriority;
  confidence: string;
  status: "open" | "resolved";
};

export type HumanActionCaseDetail = HumanActionCaseSummary & {
  eventId: string;
  fighterId: string;
  requirementId: string;
  createdAt: string;
  summary: string;
  confidenceScore: string;
  documentName: string;
  documentMeta: string;
  documentSubmissionId: string | null;
  aiExtracted: Array<{ label: string; value: string }>;
  existingRecord: Array<{ label: string; value: string }>;
  mismatch: string;
  recommendation: string;
};

export type HumanActionDecision =
  | "approve_extracted"
  | "correct_and_accept"
  | "request_resubmission"
  | "request_new_file"
  | "mark_not_applicable"
  | "reject"
  | "contact_participant";
