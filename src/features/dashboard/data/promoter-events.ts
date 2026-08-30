export type PromoterEventStatus = "draft" | "upcoming" | "active";

export type RequirementTone = "critical" | "high" | "medium" | "low";
export type RequirementStatus = "accepted" | "missing" | "under_review";

export type PromoterEventSummary = {
  id?: string;
  slug: string;
  name: string;
  organization: string;
  date: string;
  location: string;
  fights: number;
  fighters: number;
  status: PromoterEventStatus;
  waitingItems: number;
  humanActionItems: number;
};

export type PromoterFighter = {
  name: string;
  division: string;
  country: string;
  stance: string;
  readinessLabel: string;
  readinessPercent: number;
  managerName?: string;
  managerEmail?: string;
  tags: Array<{
    label: string;
    tone: "success" | "warning" | "neutral" | "processing";
  }>;
};

export type PromoterBout = {
  id: string;
  label: string;
  order: string;
  division: string;
  readinessPercent: number;
  leftFighter: PromoterFighter;
  rightFighter: PromoterFighter;
};

export type FightRequirementRow = {
  name: string;
  dueDate: string;
  priority: RequirementTone;
  leftStatus: RequirementStatus;
  leftConfidence: string;
  leftNote: string;
  rightStatus: RequirementStatus;
  rightConfidence: string;
  rightNote: string;
};

export type FightInsight = {
  completed: number;
  missing: number;
  underReview: number;
  waitingFor: Array<{
    label: string;
    tone: "critical" | "high";
  }>;
  nextAction: string;
};

export type PromoterFightDetail = {
  id: string;
  eventSlug: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  bout: PromoterBout;
  requirements: FightRequirementRow[];
  insight: FightInsight;
};

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
  createdAt: string;
  summary: string;
  confidenceScore: string;
  documentName: string;
  documentMeta: string;
  aiExtracted: Array<{
    label: string;
    value: string;
  }>;
  existingRecord: Array<{
    label: string;
    value: string;
  }>;
  mismatch: string;
  recommendation: string;
};

export type ActivityActorType = "ai" | "manager" | "fighter";

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

export type DocumentCategory = {
  label: string;
  count: number;
};

export type DocumentEventFilter = {
  label: string;
  value: string;
};

export type DocumentStorageFile = {
  id: string;
  event: string;
  name: string;
  size: string;
  uploadedAt: string;
  owner: string;
  category: string;
};

export type PromoterEventDetail = PromoterEventSummary & {
  tabs: string[];
  readiness: {
    fights: {
      ready: number;
      waiting: number;
      humanAction: number;
    };
    fighters: {
      ready: number;
      waiting: number;
      humanAction: number;
    };
  };
  bouts: PromoterBout[];
};

const ahmedLightweight: PromoterFighter = {
  name: "Ahmed Al-Farsi",
  division: "Lightweight",
  country: "UAE",
  stance: "Orthodox",
  readinessLabel: "Ready",
  readinessPercent: 100,
  managerName: "Khalid Mansour",
  managerEmail: "khalid@mgmt.ae",
  tags: [
    { label: "Ready", tone: "success" },
    { label: "Medical cleared", tone: "neutral" },
  ],
};

const lucasLightweightWaiting: PromoterFighter = {
  name: "Lucas Ferreira",
  division: "Lightweight",
  country: "BRA",
  stance: "Southpaw",
  readinessLabel: "Waiting",
  readinessPercent: 72,
  managerName: "Diego Souza",
  managerEmail: "diego@nova.br",
  tags: [
    { label: "Waiting", tone: "warning" },
    { label: "Medical clearance missing", tone: "warning" },
  ],
};

const lucasWelterweightReady: PromoterFighter = {
  name: "Lucas Ferreira",
  division: "Welterweight",
  country: "BRA",
  stance: "Southpaw",
  readinessLabel: "Ready",
  readinessPercent: 100,
  managerName: "Diego Souza",
  managerEmail: "diego@nova.br",
  tags: [
    { label: "Medical cleared", tone: "neutral" },
    { label: "Ready", tone: "success" },
  ],
};

export const promoterEvents: PromoterEventSummary[] = [
  {
    slug: "desert-clash-14",
    name: "Desert Clash 14",
    organization: "FightOps Arena",
    date: "2026-09-12",
    location: "Etihad Arena, Abu Dhabi",
    fights: 8,
    fighters: 16,
    status: "upcoming",
    waitingItems: 20,
    humanActionItems: 0,
  },
  {
    slug: "atlantic-showdown",
    name: "Atlantic Showdown",
    organization: "Elite Combat League",
    date: "2026-10-03",
    location: "O2 Arena, London",
    fights: 0,
    fighters: 0,
    status: "draft",
    waitingItems: 6,
    humanActionItems: 1,
  },
  {
    slug: "rising-titans-3",
    name: "Rising Titans 3",
    organization: "FightOps Arena",
    date: "2026-08-30",
    location: "Ariake Coliseum, Tokyo",
    fights: 8,
    fighters: 16,
    status: "active",
    waitingItems: 4,
    humanActionItems: 0,
  },
];

export const promoterEventDetails: Record<string, PromoterEventDetail> = {
  "desert-clash-14": {
    ...promoterEvents[0],
    tabs: [
      "Fight Card",
      "Required Documents",
      "Human Action",
      "Post Reminders",
      "Event Knowledge",
      "Communications",
    ],
    readiness: {
      fights: { ready: 0, waiting: 8, humanAction: 0 },
      fighters: { ready: 6, waiting: 10, humanAction: 0 },
    },
    bouts: [
      {
        id: "desert-clash-14-bout-01",
        label: "Bout 01",
        order: "01",
        division: "Lightweight",
        readinessPercent: 88,
        leftFighter: ahmedLightweight,
        rightFighter: lucasLightweightWaiting,
      },
      {
        id: "desert-clash-14-bout-02",
        label: "Bout 02",
        order: "02",
        division: "Welterweight",
        readinessPercent: 100,
        leftFighter: {
          ...ahmedLightweight,
          division: "Welterweight",
        },
        rightFighter: lucasWelterweightReady,
      },
      {
        id: "desert-clash-14-bout-03",
        label: "Bout 03",
        order: "03",
        division: "Lightweight",
        readinessPercent: 88,
        leftFighter: ahmedLightweight,
        rightFighter: lucasLightweightWaiting,
      },
      {
        id: "desert-clash-14-bout-04",
        label: "Bout 04",
        order: "04",
        division: "Welterweight",
        readinessPercent: 100,
        leftFighter: {
          ...ahmedLightweight,
          division: "Welterweight",
        },
        rightFighter: lucasWelterweightReady,
      },
    ],
  },
  "atlantic-showdown": {
    ...promoterEvents[1],
    tabs: [
      "Fight Card",
      "Required Documents",
      "Human Action",
      "Post Reminders",
      "Event Knowledge",
      "Communications",
    ],
    readiness: {
      fights: { ready: 0, waiting: 0, humanAction: 0 },
      fighters: { ready: 0, waiting: 0, humanAction: 0 },
    },
    bouts: [],
  },
  "rising-titans-3": {
    ...promoterEvents[2],
    tabs: [
      "Fight Card",
      "Required Documents",
      "Human Action",
      "Post Reminders",
      "Event Knowledge",
      "Communications",
    ],
    readiness: {
      fights: { ready: 8, waiting: 0, humanAction: 0 },
      fighters: { ready: 16, waiting: 0, humanAction: 0 },
    },
    bouts: [],
  },
};

export const promoterFightDetails: Record<string, PromoterFightDetail> = {
  "desert-clash-14-bout-01": {
    id: "desert-clash-14-bout-01",
    eventSlug: "desert-clash-14",
    eventName: "Desert Clash 14",
    eventDate: "2026-09-12",
    eventLocation: "Etihad Arena, Abu Dhabi",
    bout: promoterEventDetails["desert-clash-14"].bouts[0],
    requirements: [
      {
        name: "Signed Contract / Agreement",
        dueDate: "2026-09-02",
        priority: "critical",
        leftStatus: "accepted",
        leftConfidence: "96% confidence",
        leftNote: "Signed agreement verified",
        rightStatus: "accepted",
        rightConfidence: "94% confidence",
        rightNote: "Signed agreement verified",
      },
      {
        name: "Passport / ID",
        dueDate: "2026-09-02",
        priority: "critical",
        leftStatus: "accepted",
        leftConfidence: "96% confidence",
        leftNote: "Passport scan matched",
        rightStatus: "accepted",
        rightConfidence: "91% confidence",
        rightNote: "ID verified by operations",
      },
      {
        name: "Medical Clearance",
        dueDate: "2026-09-02",
        priority: "critical",
        leftStatus: "accepted",
        leftConfidence: "96% confidence",
        leftNote: "Medical certificate approved",
        rightStatus: "missing",
        rightConfidence: "Action needed",
        rightNote: "Awaiting physician upload",
      },
      {
        name: "Insurance Certificate",
        dueDate: "2026-09-02",
        priority: "high",
        leftStatus: "accepted",
        leftConfidence: "96% confidence",
        leftNote: "Policy attached",
        rightStatus: "under_review",
        rightConfidence: "Needs check",
        rightNote: "Coverage date mismatch",
      },
      {
        name: "Weight Confirmation",
        dueDate: "2026-09-02",
        priority: "high",
        leftStatus: "accepted",
        leftConfidence: "96% confidence",
        leftNote: "155 lb confirmed",
        rightStatus: "accepted",
        rightConfidence: "89% confidence",
        rightNote: "155 lb confirmed",
      },
      {
        name: "Fighter Information",
        dueDate: "2026-09-02",
        priority: "medium",
        leftStatus: "accepted",
        leftConfidence: "96% confidence",
        leftNote: "Manager: Khalid Mansour",
        rightStatus: "accepted",
        rightConfidence: "92% confidence",
        rightNote: "Manager: Rafael Costa",
      },
      {
        name: "Photo / Media",
        dueDate: "2026-09-02",
        priority: "medium",
        leftStatus: "accepted",
        leftConfidence: "96% confidence",
        leftNote: "Headshot and promo media ready",
        rightStatus: "accepted",
        rightConfidence: "95% confidence",
        rightNote: "Headshot and promo media ready",
      },
      {
        name: "Travel Information",
        dueDate: "2026-09-02",
        priority: "low",
        leftStatus: "accepted",
        leftConfidence: "96% confidence",
        leftNote: "Arrival itinerary attached",
        rightStatus: "accepted",
        rightConfidence: "87% confidence",
        rightNote: "Hotel confirmation attached",
      },
    ],
    insight: {
      completed: 15,
      missing: 1,
      underReview: 1,
      waitingFor: [
        { label: "Lucas medical clearance", tone: "critical" },
        { label: "Lucas insurance review", tone: "high" },
      ],
      nextAction:
        "Request missing medical certificate from Lucas Ferreira's team before bout approval.",
    },
  },
};

export const editFightCardRows = [
  {
    order: "01",
    leftName: "Marcus Reed",
    leftDivision: "Welterweight",
    rightName: "Yusuf Demir",
    rightDivision: "Welterweight",
    tags: [
      { label: "Processing", tone: "processing" as const },
      { label: "Waiting", tone: "warning" as const },
    ],
  },
  {
    order: "02",
    leftName: "Ahmed Al-Farsi",
    leftDivision: "Lightweight",
    rightName: "Lucas Ferreira",
    rightDivision: "Lightweight",
    tags: [
      { label: "Ready", tone: "success" as const },
      { label: "Waiting", tone: "warning" as const },
    ],
  },
  {
    order: "03",
    leftName: "Hiroshi Tanaka",
    leftDivision: "Featherweight",
    rightName: "Diego Morales",
    rightDivision: "Featherweight",
    tags: [
      { label: "Ready", tone: "success" as const },
      { label: "Processing", tone: "processing" as const },
    ],
  },
  {
    order: "04",
    leftName: "Sven Lindqvist",
    leftDivision: "Middleweight",
    rightName: "Omar Haddad",
    rightDivision: "Middleweight",
    tags: [
      { label: "Waiting", tone: "warning" as const },
      { label: "Ready", tone: "success" as const },
    ],
  },
  {
    order: "05",
    leftName: "Raj Patel",
    leftDivision: "Bantamweight",
    rightName: "Chen Wei",
    rightDivision: "Bantamweight",
    tags: [
      { label: "Waiting", tone: "warning" as const },
      { label: "Ready", tone: "success" as const },
    ],
  },
  {
    order: "06",
    leftName: "Bruno Costa",
    leftDivision: "Heavyweight",
    rightName: "Anton Kovac",
    rightDivision: "Heavyweight",
    tags: [
      { label: "Waiting", tone: "warning" as const },
      { label: "Processing", tone: "processing" as const },
    ],
  },
  {
    order: "07",
    leftName: "Liam O'Connor",
    leftDivision: "Lightweight",
    rightName: "Tariq Aziz",
    rightDivision: "Lightweight",
    tags: [
      { label: "Ready", tone: "success" as const },
      { label: "Waiting", tone: "warning" as const },
    ],
  },
  {
    order: "08",
    leftName: "Noah Berg",
    leftDivision: "Welterweight",
    rightName: "Felipe Ramos",
    rightDivision: "Welterweight",
    tags: [
      { label: "Ready", tone: "success" as const },
      { label: "Waiting", tone: "warning" as const },
    ],
  },
];

export const humanActionCases: HumanActionCaseSummary[] = [
  {
    id: "marcus-reed-passport-id",
    eventSlug: "desert-clash-14",
    eventName: "Desert Clash 14",
    fighterName: "Marcus Reed",
    reason: "Passport name mismatch",
    requirement: "Passport / ID",
    priority: "critical",
    confidence: "58% confidence",
    status: "open",
  },
  {
    id: "diego-morales-medical-clearance",
    eventSlug: "desert-clash-14",
    eventName: "Desert Clash 14",
    fighterName: "Diego Morales",
    reason: "Medical expiry uncertain",
    requirement: "Medical Clearance",
    priority: "high",
    confidence: "64% confidence",
    status: "open",
  },
  {
    id: "anton-kovac-insurance-certificate",
    eventSlug: "desert-clash-14",
    eventName: "Desert Clash 14",
    fighterName: "Anton Kovac",
    reason: "Contradictory information",
    requirement: "Insurance Certificate",
    priority: "high",
    confidence: "49% confidence",
    status: "open",
  },
];

export const humanActionCaseDetails: Record<string, HumanActionCaseDetail> = {
  "marcus-reed-passport-id": {
    ...humanActionCases[0],
    createdAt: "2026-08-22 09:14",
    summary:
      "Passport reads 'Marcus R. Reed' but fighter record shows 'Marcus Reed'. AI cannot confirm identity match.",
    confidenceScore: "58% confidence",
    documentName: "passport__id_marcus_reed.pdf",
    documentMeta: "PDF · 1 page",
    aiExtracted: [
      { label: "Name", value: "Marcus R. Reed" },
      { label: "Nationality", value: "United Kingdom" },
      { label: "Expiry", value: "12 Mar 2030" },
    ],
    existingRecord: [
      { label: "Name", value: "Marcus Reed" },
      { label: "Nationality", value: "United Kingdom" },
      { label: "Expiry", value: "—" },
    ],
    mismatch: "Name field differs: 'Marcus R. Reed' vs 'Marcus Reed'",
    recommendation:
      "Confirm the passport belongs to the registered fighter. If confirmed, update the fighter record name to match the passport.",
  },
  "diego-morales-medical-clearance": {
    ...humanActionCases[1],
    createdAt: "2026-08-24 14:28",
    summary:
      "Medical certificate expiry appears partially obscured. AI cannot confirm whether the clearance remains valid through event week.",
    confidenceScore: "64% confidence",
    documentName: "medical_clearance_diego_morales.pdf",
    documentMeta: "PDF - 2 pages",
    aiExtracted: [
      { label: "Name", value: "Diego Morales" },
      { label: "Doctor", value: "Dr. Sato Clinic" },
      { label: "Expiry", value: "Unclear scan" },
    ],
    existingRecord: [
      { label: "Name", value: "Diego Morales" },
      { label: "Doctor", value: "Dr. Sato Clinic" },
      { label: "Expiry", value: "2026-09-01" },
    ],
    mismatch:
      "Expiry date cannot be verified from the uploaded scan with enough confidence.",
    recommendation:
      "Request a clearer certificate or confirm the expiry date directly with the medical provider before approval.",
  },
  "anton-kovac-insurance-certificate": {
    ...humanActionCases[2],
    createdAt: "2026-08-25 11:02",
    summary:
      "Insurance file contains conflicting coverage dates between the summary page and attached endorsement. AI cannot determine the valid policy term.",
    confidenceScore: "49% confidence",
    documentName: "insurance_certificate_anton_kovac.pdf",
    documentMeta: "PDF - 3 pages",
    aiExtracted: [
      { label: "Name", value: "Anton Kovac" },
      { label: "Coverage start", value: "2026-08-15" },
      { label: "Coverage end", value: "2026-09-10" },
    ],
    existingRecord: [
      { label: "Name", value: "Anton Kovac" },
      { label: "Coverage start", value: "2026-08-15" },
      { label: "Coverage end", value: "2026-09-15" },
    ],
    mismatch:
      "Coverage end date differs between the uploaded certificate and the stored record.",
    recommendation:
      "Verify the correct policy end date with the insurer or request a replacement certificate before clearing the bout.",
  },
};

export const activityLogEntries: ActivityLogEntry[] = [
  {
    id: "activity-01",
    timestamp: "2026-08-25 05:48",
    actorLabel: "AI",
    actorType: "ai",
    fighterName: "Ahmed Al-Farsi",
    actionTitle: "Document classified",
    actionDescription: "Passport detected and OCR completed.",
    stateChange: "Received -> Processing",
    confidence: "96% confidence",
  },
  {
    id: "activity-02",
    timestamp: "2026-08-25 05:48",
    actorLabel: "AI",
    actorType: "ai",
    fighterName: "Ahmed Al-Farsi",
    actionTitle: "Information extracted",
    actionDescription: "Name, nationality and expiry extracted from passport.",
    stateChange: "Processing -> Under Review",
    confidence: "96% confidence",
  },
  {
    id: "activity-03",
    timestamp: "2026-08-25 05:49",
    actorLabel: "AI",
    actorType: "ai",
    fighterName: "Ahmed Al-Farsi",
    actionTitle: "Requirement matched",
    actionDescription: "Extracted identity matches fighter record.",
    stateChange: "Under Review -> Accepted",
    confidence: "96% confidence",
  },
  {
    id: "activity-04",
    timestamp: "2026-08-24 11:31",
    actorLabel: "AI",
    actorType: "ai",
    fighterName: "Anton Kovac",
    actionTitle: "Escalated to Human Action",
    actionDescription:
      "Contradictory information detected on insurance certificate.",
    stateChange: "Under Review -> Human Action",
    confidence: "49% confidence",
  },
  {
    id: "activity-05",
    timestamp: "2026-08-23 14:03",
    actorLabel: "AI",
    actorType: "ai",
    fighterName: "Diego Morales",
    actionTitle: "Escalated to Human Action",
    actionDescription:
      "Medical expiry date could not be read with sufficient confidence.",
    stateChange: "Under Review -> Human Action",
    confidence: "64% confidence",
  },
  {
    id: "activity-06",
    timestamp: "2026-08-23 09:20",
    actorLabel: "Lucas Ferreira",
    actorType: "fighter",
    fighterName: "Lucas Ferreira",
    actionTitle: "Document uploaded",
    actionDescription: "Passport uploaded via secure link.",
    stateChange: "Not Submitted -> Received",
    confidence: "-",
  },
  {
    id: "activity-07",
    timestamp: "2026-08-22 09:15",
    actorLabel: "AI",
    actorType: "ai",
    fighterName: "Marcus Reed",
    actionTitle: "Escalated to Human Action",
    actionDescription:
      "Passport name mismatch - identity cannot be auto-confirmed.",
    stateChange: "Under Review -> Human Action",
    confidence: "58% confidence",
  },
  {
    id: "activity-08",
    timestamp: "2026-08-21 16:40",
    actorLabel: "Khalid Mansour",
    actorType: "manager",
    fighterName: "Ahmed Al-Farsi",
    actionTitle: "Signed agreement uploaded",
    actionDescription: "Signed bout agreement uploaded by manager.",
    stateChange: "Not Submitted -> Received",
    confidence: "-",
  },
];

export const documentCategories: DocumentCategory[] = [
  { label: "All Files", count: 212 },
  { label: "Contracts", count: 30 },
  { label: "Medical", count: 24 },
  { label: "Insurance", count: 24 },
  { label: "Legal", count: 32 },
  { label: "Fighters", count: 102 },
];

export const documentEventFilters: DocumentEventFilter[] = [
  { label: "All Events", value: "all-events" },
  { label: "Desert Clash 14", value: "desert-clash-14" },
  { label: "Atlantic Showdown", value: "atlantic-showdown" },
  { label: "Rising Titans 3", value: "rising-titans-3" },
  { label: "Unassigned", value: "unassigned" },
];

export const documentStorageFiles: DocumentStorageFile[] = [
  {
    id: "doc-01",
    event: "desert-clash-14",
    name: "signed_agreement_ahmed_al_farsi.pdf",
    size: "2.5 MB",
    uploadedAt: "2026-08-21",
    owner: "Ahmed Al-Farsi",
    category: "Contracts",
  },
  {
    id: "doc-02",
    event: "desert-clash-14",
    name: "passport_ahmed_al_farsi.pdf",
    size: "2.3 MB",
    uploadedAt: "2026-08-21",
    owner: "Ahmed Al-Farsi",
    category: "Legal",
  },
  {
    id: "doc-03",
    event: "desert-clash-14",
    name: "medical_clearance_ahmed_al_farsi.pdf",
    size: "2.0 MB",
    uploadedAt: "2026-08-21",
    owner: "Ahmed Al-Farsi",
    category: "Medical",
  },
  {
    id: "doc-04",
    event: "desert-clash-14",
    name: "insurance_ahmed_al_farsi.pdf",
    size: "2.4 MB",
    uploadedAt: "2026-08-21",
    owner: "Ahmed Al-Farsi",
    category: "Insurance",
  },
  {
    id: "doc-05",
    event: "desert-clash-14",
    name: "weight_ahmed_al_farsi.pdf",
    size: "2.1 MB",
    uploadedAt: "2026-08-21",
    owner: "Ahmed Al-Farsi",
    category: "Fighters",
  },
  {
    id: "doc-06",
    event: "desert-clash-14",
    name: "fighter_info_ahmed_al_farsi.pdf",
    size: "2.1 MB",
    uploadedAt: "2026-08-21",
    owner: "Ahmed Al-Farsi",
    category: "Fighters",
  },
  {
    id: "doc-07",
    event: "desert-clash-14",
    name: "headshot_ahmed_al_farsi.jpg",
    size: "1.2 MB",
    uploadedAt: "2026-08-21",
    owner: "Ahmed Al-Farsi",
    category: "Fighters",
  },
  {
    id: "doc-08",
    event: "desert-clash-14",
    name: "travel_ahmed_al_farsi.pdf",
    size: "2.1 MB",
    uploadedAt: "2026-08-21",
    owner: "Ahmed Al-Farsi",
    category: "Fighters",
  },
];

export function getPromoterEventBySlug(slug: string) {
  return promoterEventDetails[slug] ?? null;
}

export function getPromoterFightById(fightId: string) {
  return promoterFightDetails[fightId] ?? null;
}

export function getHumanActionCaseById(caseId: string) {
  return humanActionCaseDetails[caseId] ?? null;
}
