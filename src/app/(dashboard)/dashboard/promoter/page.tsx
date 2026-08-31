import { PromoterOverview } from "@/features/dashboard/components/promoter-overview";
import {
  getPromoterOverviewStats,
  listPromoterDashboardEvents,
} from "@/server/services/events.service";

export default async function PromoterDashboardPage() {
  const events = await listPromoterDashboardEvents();
  const stats = events.length > 0 ? await getPromoterOverviewStats() : undefined;

  return (
    <PromoterOverview
      events={events}
      stats={stats}
    />
  );
}
