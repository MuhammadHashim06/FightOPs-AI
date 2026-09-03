import { notFound } from "next/navigation";

import { HumanActionCasePage } from "@/features/dashboard/components/human-action-case-page";
import { getHumanActionCaseByIdForUser } from "@/server/services/human-action.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

type HumanActionCaseRouteProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export default async function AdminHumanActionCaseRoute({
  params,
}: HumanActionCaseRouteProps) {
  const { caseId } = await params;
  const user = await getAuthenticatedUser();
  const item = user ? await getHumanActionCaseByIdForUser(caseId, user) : null;

  if (!item) {
    notFound();
  }

  return (
    <HumanActionCasePage
      item={item}
      basePath="/dashboard/admin/human-action"
    />
  );
}
