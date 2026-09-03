import { notFound } from "next/navigation";

import { FightDetailsPage } from "@/features/dashboard/components/fight-details-page";
import { getPromoterFightDetailBySlugAndId } from "@/server/services/events.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

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
  const user = await getAuthenticatedUser();
  const fight = user
    ? await getPromoterFightDetailBySlugAndId(eventSlug, fightId, user)
    : null;

  if (!fight) {
    notFound();
  }

  return <FightDetailsPage fight={fight} />;
}
