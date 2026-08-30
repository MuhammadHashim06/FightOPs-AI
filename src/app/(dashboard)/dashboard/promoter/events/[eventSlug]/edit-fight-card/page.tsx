import { notFound } from "next/navigation";

import { EditFightCardPage } from "@/features/dashboard/components/edit-fight-card-page";
import { getPromoterEventBySlug } from "@/features/dashboard/data/promoter-events";

type EditFightCardRouteProps = {
  params: Promise<{
    eventSlug: string;
  }>;
};

export default async function EditFightCardRoute({
  params,
}: EditFightCardRouteProps) {
  const { eventSlug } = await params;
  const event = getPromoterEventBySlug(eventSlug);

  if (!event) {
    notFound();
  }

  return <EditFightCardPage eventSlug={eventSlug} />;
}
