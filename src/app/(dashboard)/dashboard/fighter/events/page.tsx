import { FighterFightDetailsPage } from "@/features/dashboard/components/fighter-fight-details-page";
import { listFighterFightCardsForUser } from "@/server/services/fighter-portal.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

export default async function FighterEventsPage() {
  const user = await getAuthenticatedUser();
  const fights = user ? await listFighterFightCardsForUser(user) : null;

  return <FighterFightDetailsPage fights={fights ?? []} />;
}
