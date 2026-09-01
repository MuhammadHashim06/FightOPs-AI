import { notFound } from "next/navigation";

import { PromoterFighterDetailPage } from "@/features/dashboard/components/promoter-fighter-detail-page";
import { getPromoterEventFighterDetailBySlugAndId } from "@/server/services/events.service";

type PromoterFighterDetailRouteProps = {
  params: Promise<{
    eventSlug: string;
    fighterId: string;
  }>;
};

export default async function PromoterFighterDetailRoute({
  params,
}: PromoterFighterDetailRouteProps) {
  const { eventSlug, fighterId } = await params;
  const data = await getPromoterEventFighterDetailBySlugAndId(eventSlug, fighterId);

  if (!data) {
    notFound();
  }

  return <PromoterFighterDetailPage data={data} />;
}
