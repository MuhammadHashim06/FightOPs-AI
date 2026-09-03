import { redirect } from "next/navigation";

import { CreateEventForm } from "@/features/dashboard/components/create-event-form";
import { listDefaultRequirementTemplatesForUser } from "@/server/services/requirement-templates.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

export default async function CreatePromoterEventPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const templates = await listDefaultRequirementTemplatesForUser(user.id);

  return <CreateEventForm initialTemplates={templates} />;
}
