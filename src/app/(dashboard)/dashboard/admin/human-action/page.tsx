import { HumanActionPage } from "@/features/dashboard/components/human-action-page";
import { listHumanActionCases } from "@/server/services/human-action.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

export default async function AdminHumanActionPage() {
  const user = await getAuthenticatedUser();
  const cases = user ? await listHumanActionCases(user) : [];

  return (
    <HumanActionPage
      cases={cases}
      basePath="/dashboard/admin/human-action"
    />
  );
}
