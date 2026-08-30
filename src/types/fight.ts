export type FightStatus = "announced" | "scheduled" | "live" | "completed";

export type Fight = {
  id: string;
  promotion: string;
  redCorner: string;
  blueCorner: string;
  status: FightStatus;
  scheduledAt: string;
  venue: string;
};
