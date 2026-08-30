import { notFound } from "next/navigation";

import { EventRemindersPage } from "@/features/dashboard/components/event-reminders-page";
import { getPromoterEventBySlug } from "@/features/dashboard/data/promoter-events";
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
  const mockEvent = getPromoterEventBySlug(eventSlug);

  if (!event && !mockEvent) {
    notFound();
  }

  const reminders = event
    ? await listEventReminders(event.id)
    : { reminders: [], summary: { total: 0, pending: 0, sent: 0, overdue: 0 } };

  return (
    <EventRemindersPage
      eventSlug={eventSlug}
      eventId={event?.id}
      eventName={event?.name ?? mockEvent?.name ?? "Event"}
      initialSummary={reminders.summary}
      initialReminders={reminders.reminders}
    />
  );
}
