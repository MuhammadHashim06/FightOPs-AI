import { PromoterEventsPage } from "@/features/dashboard/components/promoter-events-page";
import { promoterEvents } from "@/features/dashboard/data/promoter-events";
import { listPromoterDashboardEvents } from "@/server/services/events.service";

export default async function PromoterEventsRoute() {
  const events = await listPromoterDashboardEvents();

  return <PromoterEventsPage events={events.length > 0 ? events : promoterEvents} />;
}
