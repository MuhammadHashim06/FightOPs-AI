import { notFound } from "next/navigation";

import { EventRequirementsPage } from "@/features/dashboard/components/event-requirements-page";
import { getPromoterEventBySlug } from "@/features/dashboard/data/promoter-events";
import { listEventRequirements } from "@/server/services/event-requirements.service";
import { getEventBySlug } from "@/server/services/events.service";

type EventRequirementsRouteProps = {
  params: Promise<{
    eventSlug: string;
  }>;
};

export default async function EventRequirementsRoute({
  params,
}: EventRequirementsRouteProps) {
  const { eventSlug } = await params;
  const event = await getEventBySlug(eventSlug);
  const mockEvent = getPromoterEventBySlug(eventSlug);

  if (!event && !mockEvent) {
    notFound();
  }

  const requirements = event ? await listEventRequirements(event.id) : [];

  return (
    <EventRequirementsPage
      eventSlug={eventSlug}
      eventId={event?.id}
      eventName={event?.name ?? mockEvent?.name ?? "Event"}
      requirements={requirements}
    />
  );
}
