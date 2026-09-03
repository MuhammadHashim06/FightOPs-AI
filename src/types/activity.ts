export type ActivityActorType = "ai" | "manager" | "fighter" | "admin" | "promoter";

export type ActivityLogEntry = {
  id: string;
  timestamp: string;
  actorLabel: string;
  actorType: ActivityActorType;
  fighterName: string;
  actionTitle: string;
  actionDescription: string;
  stateChange: string;
  confidence: string;
};
