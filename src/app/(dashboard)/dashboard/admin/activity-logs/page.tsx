import { PromoterActivityPage } from "@/features/dashboard/components/promoter-activity-page";
import { listActivityLogEntries } from "@/server/services/activity.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

export default async function AdminActivityLogsPage() {
  const user = await getAuthenticatedUser();
  const entries = user ? await listActivityLogEntries(user) : [];

  return <PromoterActivityPage entries={entries} />;
}
