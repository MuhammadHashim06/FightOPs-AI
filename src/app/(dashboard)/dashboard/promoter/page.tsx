import { PromoterOverview } from "@/features/dashboard/components/promoter-overview";
import {
  getPromoterOverviewStats,
  listPromoterDashboardEvents,
} from "@/server/services/events.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

export default async function PromoterDashboardPage() {
  const user = await getAuthenticatedUser();
  const events = user ? await listPromoterDashboardEvents(user) : [];
  const stats = user && events.length > 0 ? await getPromoterOverviewStats(user) : undefined;

  return (
    <PromoterOverview
      events={events}
      stats={stats}
    />
  );
}
