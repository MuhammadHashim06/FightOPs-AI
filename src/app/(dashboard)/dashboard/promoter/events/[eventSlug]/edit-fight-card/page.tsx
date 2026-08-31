import { notFound } from "next/navigation";

import { EditFightCardPage } from "@/features/dashboard/components/edit-fight-card-page";
import { getPromoterEventDetailsBySlug } from "@/server/services/events.service";

type EditFightCardRouteProps = {
  params: Promise<{
    eventSlug: string;
  }>;
};

export default async function EditFightCardRoute({
  params,
}: EditFightCardRouteProps) {
  const { eventSlug } = await params;
  const event = await getPromoterEventDetailsBySlug(eventSlug);

  if (!event) {
    notFound();
  }

  return <EditFightCardPage eventSlug={eventSlug} rows={event.bouts} />;
}
