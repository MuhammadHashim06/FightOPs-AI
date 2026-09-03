import { redirect } from "next/navigation";

import { AdminSettingsPage } from "@/features/dashboard/components/admin-settings-page";
import { getAdminPlatformSettings } from "@/server/services/admin.service";
import { listRequirementTemplatesForUser } from "@/server/services/requirement-templates.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

export default async function AdminSettingsRoute() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const templates = await listRequirementTemplatesForUser(user.id);
  const platformSettings = await getAdminPlatformSettings(user);

  return (
    <AdminSettingsPage
      user={user}
      data={platformSettings}
      templates={templates}
    />
  );
}
