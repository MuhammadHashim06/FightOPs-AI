import type {
  CreateRequirementTemplateInput,
  UpdateRequirementTemplateInput,
} from "@/types/readiness";
import { eventRequirementsRepository } from "@/server/repositories/event-requirements.repository";
import { requirementTemplatesRepository } from "@/server/repositories/requirement-templates.repository";
import { validateCreateRequirementTemplateInput } from "@/server/validators/readiness.validator";

export const defaultRequirementTemplates: CreateRequirementTemplateInput[] = [
  {
    category: "Legal",
    name: "Passport / ID",
    description: "Government-issued identification for event travel and compliance.",
    inputType: "document",
    required: true,
    priority: "critical",
    dueDaysBeforeEvent: 5,
    dueAnchor: "after_signed_agreement_approved",
    dueOffsetDays: 3,
    reminderEnabled: true,
    reminderCadence: "daily_until_resolved",
    reminderDaysBeforeDue: [3],
    reminderSubject: "Passport or ID required",
    reminderMessage:
      "Please upload the fighter's passport or government ID before the deadline.",
    humanVerificationRequired: false,
    acceptedFileTypes: ["pdf", "jpg", "jpeg", "png"],
  },
  {
    category: "Medical",
    name: "Medical Clearance",
    description: "Current physician approval covering event week.",
    inputType: "document",
    required: true,
    priority: "critical",
    dueDaysBeforeEvent: 7,
    dueAnchor: "before_event",
    dueOffsetDays: 7,
    reminderEnabled: true,
    reminderCadence: "daily_until_resolved",
    reminderDaysBeforeDue: [5],
    reminderSubject: "Medical clearance required",
    reminderMessage:
      "Please upload the fighter's medical clearance covering event week.",
    humanVerificationRequired: true,
    acceptedFileTypes: ["pdf", "jpg", "jpeg", "png"],
  },
  {
    category: "Insurance",
    name: "Insurance Certificate",
    description: "Active coverage confirmation for the fighter and bout.",
    inputType: "document",
    required: true,
    priority: "high",
    dueDaysBeforeEvent: 5,
    dueAnchor: "after_signed_agreement_approved",
    dueOffsetDays: 5,
    reminderEnabled: true,
    reminderCadence: "daily_until_resolved",
    reminderDaysBeforeDue: [3],
    reminderSubject: "Insurance certificate required",
    reminderMessage:
      "Please upload the active insurance certificate for the fighter and bout.",
    humanVerificationRequired: false,
    acceptedFileTypes: ["pdf", "jpg", "jpeg", "png"],
  },
  {
    category: "Legal",
    name: "Signed Agreement",
    description: "Executed agreement required before final bout approval.",
    inputType: "document",
    required: true,
    priority: "critical",
    dueDaysBeforeEvent: undefined,
    dueAnchor: "after_invite_accepted",
    dueOffsetDays: 5,
    reminderEnabled: true,
    reminderCadence: "daily_until_resolved",
    reminderDaysBeforeDue: [5],
    reminderSubject: "Signed agreement required",
    reminderMessage:
      "Please upload the signed agreement before final bout approval.",
    humanVerificationRequired: true,
    isSignedAgreement: true,
    acceptedFileTypes: ["pdf"],
  },
  {
    category: "Operations",
    name: "Weight Confirmation",
    description: "Declared weight confirmation from the fighter or manager.",
    inputType: "text",
    required: true,
    priority: "high",
    dueDaysBeforeEvent: 1,
    dueAnchor: "before_event",
    dueOffsetDays: 1,
    reminderEnabled: true,
    reminderCadence: "daily_until_resolved",
    reminderDaysBeforeDue: [1],
    reminderSubject: "Weight confirmation needed",
    reminderMessage:
      "Please confirm the fighter's final weight details before event week.",
    humanVerificationRequired: false,
  },
  {
    category: "Travel",
    name: "Travel Details",
    description:
      "Share departure and arrival dates, times, origin, destination, and any booking notes.",
    inputType: "text",
    required: true,
    priority: "medium",
    dueDaysBeforeEvent: undefined,
    dueAnchor: "after_signed_agreement_approved",
    dueOffsetDays: 3,
    reminderEnabled: true,
    reminderCadence: "daily_until_resolved",
    reminderDaysBeforeDue: [2],
    reminderSubject: "Travel details needed",
    reminderMessage:
      "Please share travel dates, times, from, and to details for event coordination.",
    structuredFields: [
      {
        key: "departure_date",
        label: "Departure date",
        type: "date",
        required: true,
        placeholder: null,
      },
      {
        key: "departure_time",
        label: "Departure time",
        type: "time",
        required: true,
        placeholder: null,
      },
      {
        key: "arrival_date",
        label: "Arrival date",
        type: "date",
        required: true,
        placeholder: null,
      },
      {
        key: "arrival_time",
        label: "Arrival time",
        type: "time",
        required: true,
        placeholder: null,
      },
      {
        key: "from_location",
        label: "From",
        type: "text",
        required: true,
        placeholder: "e.g. Dubai International Airport",
      },
      {
        key: "to_location",
        label: "To",
        type: "text",
        required: true,
        placeholder: "e.g. Las Vegas",
      },
      {
        key: "flight_number",
        label: "Flight number",
        type: "text",
        required: false,
        placeholder: "e.g. EK 215",
      },
      {
        key: "hotel_details",
        label: "Hotel details",
        type: "text",
        required: false,
        placeholder: "Hotel name or booking notes",
      },
    ],
    humanVerificationRequired: false,
  },
  {
    category: "Operations",
    name: "Fighter Information",
    description:
      "Collect core fighter profile details such as nationality, stance, city, and corner team notes.",
    inputType: "text",
    required: true,
    priority: "medium",
    dueDaysBeforeEvent: undefined,
    dueAnchor: "after_invite_accepted",
    dueOffsetDays: 2,
    reminderEnabled: true,
    reminderCadence: "daily_until_resolved",
    reminderDaysBeforeDue: [3],
    reminderSubject: "Fighter information required",
    reminderMessage:
      "Please complete the fighter information fields for operations and matchmaking.",
    structuredFields: [
      {
        key: "nationality",
        label: "Nationality",
        type: "text",
        required: true,
        placeholder: "e.g. United Arab Emirates",
      },
      {
        key: "stance",
        label: "Stance",
        type: "text",
        required: true,
        placeholder: "e.g. Orthodox",
      },
      {
        key: "hometown",
        label: "Hometown",
        type: "text",
        required: false,
        placeholder: "e.g. Dubai",
      },
      {
        key: "corner_team",
        label: "Corner team",
        type: "text",
        required: false,
        placeholder: "Coach and support names",
      },
    ],
    humanVerificationRequired: false,
  },
  {
    category: "Media",
    name: "Photo / Media",
    description:
      "Headshot, walkout image, and promo assets used across event and broadcast workflows.",
    inputType: "document",
    required: true,
    priority: "medium",
    dueDaysBeforeEvent: undefined,
    dueAnchor: "after_signed_agreement_approved",
    dueOffsetDays: 4,
    reminderEnabled: true,
    reminderCadence: "daily_until_resolved",
    reminderDaysBeforeDue: [2],
    reminderSubject: "Photo and media assets required",
    reminderMessage:
      "Please upload the fighter headshot and any approved promo media assets.",
    humanVerificationRequired: false,
    acceptedFileTypes: ["jpg", "jpeg", "png", "pdf"],
  },
  {
    category: "Medical",
    name: "Bloodwork / Lab Results",
    description:
      "Recent bloodwork or lab clearance documents required by the commission or promotion.",
    inputType: "document",
    required: false,
    priority: "high",
    dueDaysBeforeEvent: 10,
    dueAnchor: "before_event",
    dueOffsetDays: 10,
    reminderEnabled: true,
    reminderCadence: "daily_until_resolved",
    reminderDaysBeforeDue: [5],
    reminderSubject: "Bloodwork results requested",
    reminderMessage:
      "Please upload the latest bloodwork or lab results required for clearance.",
    humanVerificationRequired: true,
    acceptedFileTypes: ["pdf", "jpg", "jpeg", "png"],
  },
  {
    category: "Operations",
    name: "Emergency Contact",
    description:
      "Operational emergency contact information for fight week coordination.",
    inputType: "text",
    required: true,
    priority: "medium",
    dueDaysBeforeEvent: undefined,
    dueAnchor: "after_invite_accepted",
    dueOffsetDays: 2,
    reminderEnabled: true,
    reminderCadence: "daily_until_resolved",
    reminderDaysBeforeDue: [2],
    reminderSubject: "Emergency contact details needed",
    reminderMessage:
      "Please provide an emergency contact for event operations and travel support.",
    structuredFields: [
      {
        key: "contact_name",
        label: "Contact name",
        type: "text",
        required: true,
        placeholder: "Full name",
      },
      {
        key: "contact_phone",
        label: "Contact phone",
        type: "text",
        required: true,
        placeholder: "+1 ...",
      },
      {
        key: "contact_email",
        label: "Contact email",
        type: "email",
        required: false,
        placeholder: "email@example.com",
      },
      {
        key: "relationship",
        label: "Relationship",
        type: "text",
        required: false,
        placeholder: "e.g. spouse, manager, parent",
      },
    ],
    humanVerificationRequired: false,
  },
];

const workflowTimelineUpgrades: Record<
  string,
  {
    legacyDueDaysBeforeEvent: number | null;
    dueAnchor: NonNullable<CreateRequirementTemplateInput["dueAnchor"]>;
    dueOffsetDays: number;
    reminderDaysBeforeDue?: number[];
  }
> = {
  "Passport / ID": {
    legacyDueDaysBeforeEvent: 5,
    dueAnchor: "after_signed_agreement_approved",
    dueOffsetDays: 3,
  },
  "Insurance Certificate": {
    legacyDueDaysBeforeEvent: 5,
    dueAnchor: "after_signed_agreement_approved",
    dueOffsetDays: 5,
  },
  "Signed Agreement": {
    legacyDueDaysBeforeEvent: 3,
    dueAnchor: "after_invite_accepted",
    dueOffsetDays: 5,
    reminderDaysBeforeDue: [5],
  },
  "Travel Details": {
    legacyDueDaysBeforeEvent: 4,
    dueAnchor: "after_signed_agreement_approved",
    dueOffsetDays: 3,
  },
  "Fighter Information": {
    legacyDueDaysBeforeEvent: 6,
    dueAnchor: "after_invite_accepted",
    dueOffsetDays: 2,
  },
  "Photo / Media": {
    legacyDueDaysBeforeEvent: 5,
    dueAnchor: "after_signed_agreement_approved",
    dueOffsetDays: 4,
  },
  "Emergency Contact": {
    legacyDueDaysBeforeEvent: 4,
    dueAnchor: "after_invite_accepted",
    dueOffsetDays: 2,
  },
};

export async function listRequirementTemplatesForUser(ownerUserId: string) {
  let templates = await requirementTemplatesRepository.listByOwnerUserId(ownerUserId);

  if (templates.length > 0) {
    templates = await upgradeLegacyDefaultTimelines(ownerUserId, templates);
  }

  return templates;
}

export async function createRequirementTemplateForUser(
  ownerUserId: string,
  input: CreateRequirementTemplateInput,
) {
  validateCreateRequirementTemplateInput(input);

  const sortOrder =
    typeof input.sortOrder === "number"
      ? input.sortOrder
      : await requirementTemplatesRepository.getNextSortOrder(ownerUserId);

  return requirementTemplatesRepository.create(ownerUserId, {
    ...input,
    sortOrder,
  });
}

export async function updateRequirementTemplateById(
  ownerUserId: string,
  templateId: string,
  input: UpdateRequirementTemplateInput,
) {
  validateUpdateRequirementTemplateInput(input);
  return requirementTemplatesRepository.updateOwned(ownerUserId, templateId, input);
}

export async function deleteRequirementTemplateById(
  ownerUserId: string,
  templateId: string,
) {
  return requirementTemplatesRepository.deleteOwned(ownerUserId, templateId);
}

export async function applyRequirementTemplatesToEvent(params: {
  eventId: string;
  ownerUserId: string;
  eventDate: string;
  templateIds?: string[];
}) {
  const templates = await listRequirementTemplatesForUser(params.ownerUserId);
  const selectedTemplates = Array.isArray(params.templateIds)
    ? templates.filter((template) => params.templateIds?.includes(template.id))
    : templates;

  for (const template of selectedTemplates) {
    await eventRequirementsRepository.create(params.eventId, {
      category: template.category,
      name: template.name,
      description: template.description ?? undefined,
      inputType: template.inputType,
      required: template.required,
      priority: template.priority,
      dueDate:
        resolveDueDate({
          eventDate: params.eventDate,
          dueAnchor: template.dueAnchor,
          dueOffsetDays: template.dueOffsetDays,
          fallbackDueDaysBeforeEvent: template.dueDaysBeforeEvent,
        }) ?? undefined,
      dueAnchor: template.dueAnchor,
      dueOffsetDays: template.dueOffsetDays ?? undefined,
      reminderEnabled: template.reminderEnabled,
      reminderCadence: template.reminderCadence,
      reminderDaysBeforeDue: template.reminderDaysBeforeDue,
      reminderSubject: template.reminderSubject ?? undefined,
      reminderMessage: template.reminderMessage ?? undefined,
      structuredFields: template.structuredFields,
      documentBlocks: template.documentBlocks,
      humanVerificationRequired: template.humanVerificationRequired,
      isSignedAgreement: template.isSignedAgreement,
      acceptedFileTypes: template.acceptedFileTypes,
      sortOrder: template.sortOrder,
    });
  }

  return selectedTemplates;
}

function validateUpdateRequirementTemplateInput(input: UpdateRequirementTemplateInput) {
  if (typeof input.category === "string" && !input.category.trim()) {
    throw new Error("Requirement category is required.");
  }

  if (typeof input.name === "string" && (!input.name.trim() || input.name.trim().length < 2)) {
    throw new Error("Requirement name must be at least 2 characters.");
  }

  if (typeof input.dueDaysBeforeEvent === "number" && input.dueDaysBeforeEvent < 0) {
    throw new Error("Due days before event must be zero or greater.");
  }

  if (typeof input.dueOffsetDays === "number" && input.dueOffsetDays < 0) {
    throw new Error("Due offset days must be zero or greater.");
  }

  if (
    Array.isArray(input.reminderDaysBeforeDue) &&
    input.reminderDaysBeforeDue.some((value) => value < 0)
  ) {
    throw new Error("Reminder days before due must be zero or greater.");
  }

  if (typeof input.sortOrder === "number" && input.sortOrder < 0) {
    throw new Error("Template sort order must be zero or greater.");
  }
}

async function upgradeLegacyDefaultTimelines(
  ownerUserId: string,
  templates: Awaited<ReturnType<typeof requirementTemplatesRepository.listByOwnerUserId>>,
) {
  let nextTemplates = templates;

  for (const template of templates) {
    const upgrade = workflowTimelineUpgrades[template.name];

    if (!upgrade || template.dueAnchor !== "before_event") {
      continue;
    }

    const currentOffset = template.dueOffsetDays ?? template.dueDaysBeforeEvent;

    if (currentOffset !== upgrade.legacyDueDaysBeforeEvent) {
      continue;
    }

    const updatedTemplate = await requirementTemplatesRepository.updateOwned(
      ownerUserId,
      template.id,
      {
        dueAnchor: upgrade.dueAnchor,
        dueOffsetDays: upgrade.dueOffsetDays,
        dueDaysBeforeEvent:
          upgrade.dueAnchor === "before_event" ? upgrade.dueOffsetDays : undefined,
        reminderDaysBeforeDue: upgrade.reminderDaysBeforeDue,
      },
    );

    if (updatedTemplate) {
      nextTemplates = nextTemplates.map((item) =>
        item.id === updatedTemplate.id ? updatedTemplate : item,
      );
    }
  }

  return nextTemplates;
}

function resolveDueDate(params: {
  eventDate: string;
  dueAnchor: CreateRequirementTemplateInput["dueAnchor"];
  dueOffsetDays: number | null;
  fallbackDueDaysBeforeEvent: number | null;
}) {
  const offsetDays =
    typeof params.dueOffsetDays === "number"
      ? params.dueOffsetDays
      : params.fallbackDueDaysBeforeEvent;

  if ((params.dueAnchor ?? "before_event") !== "before_event" || typeof offsetDays !== "number") {
    return null;
  }

  const dueDate = new Date(params.eventDate);

  if (Number.isNaN(dueDate.getTime())) {
    return null;
  }

  dueDate.setUTCDate(dueDate.getUTCDate() - offsetDays);
  return dueDate.toISOString();
}
