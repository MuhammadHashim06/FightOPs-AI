import { notFound } from "next/navigation";

import { FightDetailsPage } from "@/features/dashboard/components/fight-details-page";
import { getPromoterEventBySlug, getPromoterFightById } from "@/features/dashboard/data/promoter-events";

type FightDetailsRouteProps = {
  params: Promise<{
    eventSlug: string;
    fightId: string;
  }>;
};

export default async function FightDetailsRoute({
  params,
}: FightDetailsRouteProps) {
  const { eventSlug, fightId } = await params;
  const event = getPromoterEventBySlug(eventSlug);
  const fight = getPromoterFightById(fightId);

  if (!event || !fight || fight.eventSlug !== eventSlug) {
    notFound();
  }

  return <FightDetailsPage fight={fight} />;
}
