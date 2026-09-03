import { notFound } from "next/navigation";

import { PromoterEventDetails } from "@/features/dashboard/components/promoter-event-details";
import { getPromoterEventDetailsBySlug } from "@/server/services/events.service";
import { listFightCardOptions } from "@/server/services/fight-card-options.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

type EventDetailsPageProps = {
  params: Promise<{
    eventSlug: string;
  }>;
};

export default async function EventDetailsPage({
  params,
}: EventDetailsPageProps) {
  const { eventSlug } = await params;
  const user = await getAuthenticatedUser();
  const event = user ? await getPromoterEventDetailsBySlug(eventSlug, user) : null;

  if (!event) {
    notFound();
  }

  const cardGroups = await listFightCardOptions("group");

  return <PromoterEventDetails event={event} cardGroupOptions={cardGroups} />;
}
