export type EventStatus = "draft" | "upcoming" | "active" | "completed";

export type EventRecord = {
  id: string;
  slug: string;
  createdByUserId: string;
  name: string;
  date: string;
  location: string;
  status: EventStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateEventInput = {
  name: string;
  date: string;
  location: string;
  status?: EventStatus;
  note?: string;
  templateIds?: string[];
};

export type UpdateEventInput = Partial<CreateEventInput>;

export type FighterRecord = {
  id: string;
  userId: string | null;
  fullName: string;
  nationality: string | null;
  stance: string | null;
  division: string | null;
  managerName: string | null;
  managerEmail: string | null;
  managerPhone: string | null;
  photoUrl: string | null;
  contractReference: string | null;
  inviteStatus: "pending" | "accepted";
  inviteSentAt: string | null;
  inviteAcceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FightRecord = {
  id: string;
  eventId: string;
  order: number;
  division: string;
  fighterAId: string | null;
  fighterBId: string | null;
  status: "READY" | "WAITING" | "HUMAN_ACTION" | "PROCESSING";
  readinessPercentage: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateFighterInput = {
  fullName: string;
  managerName: string;
  managerEmail: string;
  managerPhone?: string;
  division?: string;
  notes?: string;
  contractReference?: string;
};

export type CreateFightInput = {
  division: string;
  fighterA: CreateFighterInput | null;
  fighterB: CreateFighterInput | null;
};

export type UpdateFightInput = CreateFightInput;
