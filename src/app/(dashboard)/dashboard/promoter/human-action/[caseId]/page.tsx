import { notFound } from "next/navigation";

import { HumanActionCasePage } from "@/features/dashboard/components/human-action-case-page";
import { getHumanActionCaseById } from "@/features/dashboard/data/promoter-events";

type HumanActionCaseRouteProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export default async function HumanActionCaseRoute({
  params,
}: HumanActionCaseRouteProps) {
  const { caseId } = await params;
  const item = getHumanActionCaseById(caseId);

  if (!item) {
    notFound();
  }

  return <HumanActionCasePage item={item} />;
}
