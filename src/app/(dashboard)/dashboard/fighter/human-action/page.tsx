import { FighterHumanActionPage } from "@/features/dashboard/components/fighter-human-action-page";
import { getFighterHumanActionForUser } from "@/server/services/fighter-portal.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

export default async function FighterHumanActionRoute() {
  const user = await getAuthenticatedUser();
  const data = user ? await getFighterHumanActionForUser(user) : null;

  return (
    <FighterHumanActionPage
      data={
        data ?? {
          fighterName: user?.profile.displayName ?? "Fighter",
          cases: [],
        }
      }
    />
  );
}
