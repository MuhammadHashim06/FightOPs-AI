import { FighterSettingsPage } from "@/features/dashboard/components/fighter-settings-page";
import { getAuthenticatedUser } from "@/server/services/session.service";

export default async function FighterSettingsRoute() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return null;
  }

  return <FighterSettingsPage user={user} />;
}
