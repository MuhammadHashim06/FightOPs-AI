import { PromoterEventsPage } from "@/features/dashboard/components/promoter-events-page";
import { listPromoterDashboardEvents } from "@/server/services/events.service";

export default async function PromoterEventsRoute() {
  const events = await listPromoterDashboardEvents();

  return <PromoterEventsPage events={events} />;
}
