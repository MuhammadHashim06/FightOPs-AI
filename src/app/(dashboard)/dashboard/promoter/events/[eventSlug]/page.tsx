import { notFound } from "next/navigation";

import { PromoterEventDetails } from "@/features/dashboard/components/promoter-event-details";
import { getPromoterEventBySlug } from "@/features/dashboard/data/promoter-events";
import { getPromoterEventDetailsBySlug } from "@/server/services/events.service";

type EventDetailsPageProps = {
  params: Promise<{
    eventSlug: string;
  }>;
};

export default async function EventDetailsPage({
  params,
}: EventDetailsPageProps) {
  const { eventSlug } = await params;
  const event =
    (await getPromoterEventDetailsBySlug(eventSlug)) ?? getPromoterEventBySlug(eventSlug);

  if (!event) {
    notFound();
  }

  return <PromoterEventDetails event={event} />;
}
