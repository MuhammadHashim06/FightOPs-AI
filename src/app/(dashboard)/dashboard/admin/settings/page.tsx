import { redirect } from "next/navigation";

import { PromoterSettingsPage } from "@/features/dashboard/components/promoter-settings-page";
import { listRequirementTemplatesForUser } from "@/server/services/requirement-templates.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

export default async function AdminSettingsPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const templates = await listRequirementTemplatesForUser(user.id);

  return <PromoterSettingsPage user={user} initialTemplates={templates} />;
}
