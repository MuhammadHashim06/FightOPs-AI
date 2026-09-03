import { notFound } from "next/navigation";

import { EventRequirementsPage } from "@/features/dashboard/components/event-requirements-page";
import { listEventRequirements } from "@/server/services/event-requirements.service";
import { getEventBySlugForUser } from "@/server/services/events.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

type EventRequirementsRouteProps = {
  params: Promise<{
    eventSlug: string;
  }>;
};

export default async function EventRequirementsRoute({
  params,
}: EventRequirementsRouteProps) {
  const { eventSlug } = await params;
  const user = await getAuthenticatedUser();
  const event = user ? await getEventBySlugForUser(eventSlug, user) : null;

  if (!event) {
    notFound();
  }

  const requirements = await listEventRequirements(event.id);

  return (
    <EventRequirementsPage
      eventSlug={eventSlug}
      eventId={event.id}
      eventName={event.name}
      requirements={requirements}
    />
  );
}
