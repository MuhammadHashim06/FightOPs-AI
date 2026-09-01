import { notFound } from "next/navigation";

import { EventReadinessPage } from "@/features/dashboard/components/event-readiness-page";
import { getPromoterEventDetailsBySlug } from "@/server/services/events.service";

type EventReadinessRouteProps = {
  params: Promise<{
    eventSlug: string;
  }>;
};

export default async function EventReadinessRoute({
  params,
}: EventReadinessRouteProps) {
  const { eventSlug } = await params;
  const event = await getPromoterEventDetailsBySlug(eventSlug);

  if (!event) {
    notFound();
  }

  return <EventReadinessPage event={event} />;
}
