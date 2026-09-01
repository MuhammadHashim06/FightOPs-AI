import { notFound } from "next/navigation";

import { EventFightersPage } from "@/features/dashboard/components/event-fighters-page";
import { getPromoterEventFighterListBySlug } from "@/server/services/events.service";

type EventFightersRouteProps = {
  params: Promise<{
    eventSlug: string;
  }>;
};

export default async function EventFightersRoute({
  params,
}: EventFightersRouteProps) {
  const { eventSlug } = await params;
  const data = await getPromoterEventFighterListBySlug(eventSlug);

  if (!data) {
    notFound();
  }

  return <EventFightersPage data={data} />;
}
