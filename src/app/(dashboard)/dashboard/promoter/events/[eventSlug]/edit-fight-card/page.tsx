import { notFound } from "next/navigation";

import { EditFightCardPage } from "@/features/dashboard/components/edit-fight-card-page";
import { getPromoterEventDetailsBySlug } from "@/server/services/events.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

type EditFightCardRouteProps = {
  params: Promise<{
    eventSlug: string;
  }>;
};

export default async function EditFightCardRoute({
  params,
}: EditFightCardRouteProps) {
  const { eventSlug } = await params;
  const user = await getAuthenticatedUser();
  const event = user ? await getPromoterEventDetailsBySlug(eventSlug, user) : null;

  if (!event) {
    notFound();
  }

  return <EditFightCardPage eventId={event.id} eventSlug={eventSlug} rows={event.bouts} />;
}
