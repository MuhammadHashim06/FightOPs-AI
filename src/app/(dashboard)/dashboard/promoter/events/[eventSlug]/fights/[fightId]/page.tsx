import { notFound } from "next/navigation";

import { FightDetailsPage } from "@/features/dashboard/components/fight-details-page";
import { getPromoterFightDetailBySlugAndId } from "@/server/services/events.service";

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
  const fight = await getPromoterFightDetailBySlugAndId(eventSlug, fightId);

  if (!fight) {
    notFound();
  }

  return <FightDetailsPage fight={fight} />;
}
