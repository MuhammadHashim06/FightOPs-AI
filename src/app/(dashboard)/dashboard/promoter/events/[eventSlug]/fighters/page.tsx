import { notFound } from "next/navigation";

import { EventFightersPage } from "@/features/dashboard/components/event-fighters-page";
import { getPromoterEventFighterListBySlug } from "@/server/services/events.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

type EventFightersRouteProps = {
  params: Promise<{
    eventSlug: string;
  }>;
};

export default async function EventFightersRoute({
  params,
}: EventFightersRouteProps) {
  const { eventSlug } = await params;
  const user = await getAuthenticatedUser();
  const data = user ? await getPromoterEventFighterListBySlug(eventSlug, user) : null;

  if (!data) {
    notFound();
  }

  return <EventFightersPage data={data} />;
}
