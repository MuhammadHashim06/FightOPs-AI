import { notFound } from "next/navigation";

import { EventRemindersPage } from "@/features/dashboard/components/event-reminders-page";
import { getEventBySlug } from "@/server/services/events.service";
import { listEventReminders } from "@/server/services/reminders.service";

type EventRemindersRouteProps = {
  params: Promise<{
    eventSlug: string;
  }>;
};

export default async function EventRemindersRoute({
  params,
}: EventRemindersRouteProps) {
  const { eventSlug } = await params;
  const event = await getEventBySlug(eventSlug);

  if (!event) {
    notFound();
  }

  const reminders = await listEventReminders(event.id);

  return (
    <EventRemindersPage
      eventSlug={eventSlug}
      eventId={event.id}
      eventName={event.name}
      initialSummary={reminders.summary}
      initialReminders={reminders.reminders}
    />
  );
}
