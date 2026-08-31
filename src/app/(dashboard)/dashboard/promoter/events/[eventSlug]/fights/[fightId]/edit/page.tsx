import { notFound } from "next/navigation";

import { EditFightPage } from "@/features/dashboard/components/edit-fight-page";
import { getPromoterFightDetailBySlugAndId } from "@/server/services/events.service";

type EditFightRouteProps = {
  params: Promise<{
    eventSlug: string;
    fightId: string;
  }>;
};

export default async function EditFightRoute({
  params,
}: EditFightRouteProps) {
  const { eventSlug, fightId } = await params;
  const fight = await getPromoterFightDetailBySlugAndId(eventSlug, fightId);

  if (!fight) {
    notFound();
  }

  return <EditFightPage fight={fight} />;
}
