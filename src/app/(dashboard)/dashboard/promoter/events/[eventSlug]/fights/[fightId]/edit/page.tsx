import { notFound } from "next/navigation";

import { EditFightPage } from "@/features/dashboard/components/edit-fight-page";
import { getPromoterFightDetailBySlugAndId } from "@/server/services/events.service";
import { listFightCardOptions } from "@/server/services/fight-card-options.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

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
  const user = await getAuthenticatedUser();
  const fight = user
    ? await getPromoterFightDetailBySlugAndId(eventSlug, fightId, user)
    : null;

  if (!fight) {
    notFound();
  }

  const [cardGroups, weightClasses] = await Promise.all([
    listFightCardOptions("group"),
    listFightCardOptions("weight_class"),
  ]);

  return (
    <EditFightPage
      fight={fight}
      cardGroupOptions={cardGroups}
      weightClassOptions={weightClasses}
    />
  );
}
