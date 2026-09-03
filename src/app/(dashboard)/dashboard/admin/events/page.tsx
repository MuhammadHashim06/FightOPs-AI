import { AdminEventsPage } from "@/features/dashboard/components/admin-events-page";
import { listAdminDashboardEvents } from "@/server/services/events.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

export default async function AdminEventsRoute() {
  const user = await getAuthenticatedUser();
  const events = user ? await listAdminDashboardEvents() : [];

  return <AdminEventsPage events={events} />;
}
