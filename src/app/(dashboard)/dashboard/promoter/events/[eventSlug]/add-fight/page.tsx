import { notFound } from "next/navigation";

import { AddFightPage } from "@/features/dashboard/components/add-fight-page";
import { getEventBySlugForUser } from "@/server/services/events.service";
import { listFightCardOptions } from "@/server/services/fight-card-options.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

type AddFightRouteProps = {
  params: Promise<{
    eventSlug: string;
  }>;
};

export default async function AddFightRoute({ params }: AddFightRouteProps) {
  const { eventSlug } = await params;
  const user = await getAuthenticatedUser();
  const event = user ? await getEventBySlugForUser(eventSlug, user) : null;

  if (!event) {
    notFound();
  }

  const [cardGroups, weightClasses] = await Promise.all([
    listFightCardOptions("group"),
    listFightCardOptions("weight_class"),
  ]);

  return (
    <AddFightPage
      eventSlug={eventSlug}
      eventId={event.id}
      cardGroupOptions={cardGroups}
      weightClassOptions={weightClasses}
    />
  );
}
