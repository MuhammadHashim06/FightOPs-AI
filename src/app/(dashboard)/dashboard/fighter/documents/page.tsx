import { FighterDocumentsPage } from "@/features/dashboard/components/fighter-documents-page";
import { getFighterDocumentsForUser } from "@/server/services/fighter-portal.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

export default async function FighterDocumentsRoute() {
  const user = await getAuthenticatedUser();
  const data = user ? await getFighterDocumentsForUser(user) : null;

  return (
    <FighterDocumentsPage
      data={
        data ?? {
          fighterName: user?.profile.displayName ?? "Fighter",
          requirements: [],
        }
      }
    />
  );
}
