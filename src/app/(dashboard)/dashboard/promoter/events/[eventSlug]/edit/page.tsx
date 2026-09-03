import { notFound } from "next/navigation";

import { EditEventForm } from "@/features/dashboard/components/edit-event-form";
import { getEventBySlugForUser } from "@/server/services/events.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

type EditEventRouteProps = {
  params: Promise<{
    eventSlug: string;
  }>;
};

export default async function EditEventRoute({ params }: EditEventRouteProps) {
  const { eventSlug } = await params;
  const user = await getAuthenticatedUser();
  const event = user ? await getEventBySlugForUser(eventSlug, user) : null;

  if (!event) {
    notFound();
  }

  return <EditEventForm event={event} />;
}
