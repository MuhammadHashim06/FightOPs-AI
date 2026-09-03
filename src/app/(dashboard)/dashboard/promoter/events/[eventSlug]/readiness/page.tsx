import { notFound } from "next/navigation";

import { EventReadinessPage } from "@/features/dashboard/components/event-readiness-page";
import { getPromoterEventDetailsBySlug } from "@/server/services/events.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

type EventReadinessRouteProps = {
  params: Promise<{
    eventSlug: string;
  }>;
};

export default async function EventReadinessRoute({
  params,
}: EventReadinessRouteProps) {
  const { eventSlug } = await params;
  const user = await getAuthenticatedUser();
  const event = user ? await getPromoterEventDetailsBySlug(eventSlug, user) : null;

  if (!event) {
    notFound();
  }

  return <EventReadinessPage event={event} />;
}
