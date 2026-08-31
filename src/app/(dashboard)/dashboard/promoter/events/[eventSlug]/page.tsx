import { notFound } from "next/navigation";

import { PromoterEventDetails } from "@/features/dashboard/components/promoter-event-details";
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
  const event = await getPromoterEventDetailsBySlug(eventSlug);

  if (!event) {
    notFound();
  }

  return <PromoterEventDetails event={event} />;
}
