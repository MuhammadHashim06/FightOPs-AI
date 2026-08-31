import { notFound } from "next/navigation";

import { FighterSingleFightPage } from "@/features/dashboard/components/fighter-single-fight-page";
import { getFighterFightDetailForUser } from "@/server/services/fighter-portal.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

type FighterFightDetailRouteProps = {
  params: Promise<{
    fightId: string;
  }>;
};

export default async function FighterFightDetailRoute({
  params,
}: FighterFightDetailRouteProps) {
  const { fightId } = await params;
  const user = await getAuthenticatedUser();

  if (!user) {
    notFound();
  }

  const fight = await getFighterFightDetailForUser(user, fightId);

  if (!fight) {
    notFound();
  }

  return <FighterSingleFightPage fight={fight} />;
}
