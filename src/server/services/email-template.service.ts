export type ReminderEmailTemplateValues = {
  recipientName: string;
  fighterName: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  requirementName: string;
  dueDate: string;
  daysRemaining: string;
  uploadLink: string;
};

const placeholderPattern = /{{\s*([a-zA-Z][a-zA-Z0-9]*)\s*}}/g;

export function renderReminderEmailTemplate(
  template: string,
  values: ReminderEmailTemplateValues,
) {
  return template.replace(placeholderPattern, (placeholder, key: string) => {
    const value = values[key as keyof ReminderEmailTemplateValues];
    return value ?? placeholder;
  });
}

