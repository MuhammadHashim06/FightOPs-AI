import { FighterNotificationsPage } from "@/features/dashboard/components/fighter-notifications-page";
import { getFighterNotificationsForUser } from "@/server/services/fighter-portal.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

export default async function FighterActivityLogsPage() {
  const user = await getAuthenticatedUser();
  const data = user ? await getFighterNotificationsForUser(user) : null;

  return (
    <FighterNotificationsPage
      data={
        data ?? {
          fighterName: user?.profile.displayName ?? "Fighter",
          notifications: [],
        }
      }
    />
  );
}
