import { notFound } from "next/navigation";

import { AddFightPage } from "@/features/dashboard/components/add-fight-page";
import { getPromoterEventBySlug } from "@/features/dashboard/data/promoter-events";
import { getEventBySlug } from "@/server/services/events.service";

type AddFightRouteProps = {
  params: Promise<{
    eventSlug: string;
  }>;
};

export default async function AddFightRoute({ params }: AddFightRouteProps) {
  const { eventSlug } = await params;
  const event = await getEventBySlug(eventSlug);
  const mockEvent = getPromoterEventBySlug(eventSlug);

  if (!event && !mockEvent) {
    notFound();
  }

  return <AddFightPage eventSlug={eventSlug} eventId={event?.id} />;
}
