import { notFound } from "next/navigation";

import { FightCardPreviewPage } from "@/features/dashboard/components/fight-card-preview-page";
import { getPromoterEventDetailsBySlug } from "@/server/services/events.service";
import { listFightCardOptions } from "@/server/services/fight-card-options.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

type FightCardPreviewRouteProps = {
  params: Promise<{
    eventSlug: string;
  }>;
};

export default async function FightCardPreviewRoute({
  params,
}: FightCardPreviewRouteProps) {
  const { eventSlug } = await params;
  const user = await getAuthenticatedUser();
  const event = user ? await getPromoterEventDetailsBySlug(eventSlug, user) : null;

  if (!event) {
    notFound();
  }

  const cardGroups = await listFightCardOptions("group");

  return (
    <FightCardPreviewPage
      event={event}
      cardGroupOptions={cardGroups}
    />
  );
}
