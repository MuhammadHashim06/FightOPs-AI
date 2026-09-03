import { AdminDashboardPage } from "@/features/dashboard/components/admin-dashboard-page";
import { getAdminOverviewData } from "@/server/services/admin.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

export default async function AdminDashboardRoute() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return <AdminDashboardPage data={emptyAdminOverviewData()} />;
  }

  return <AdminDashboardPage data={await getAdminOverviewData(user)} />;
}

function emptyAdminOverviewData() {
  return {
    events: [],
    stats: {
      totalEvents: 0,
      activeEvents: 0,
      totalFights: 0,
      totalFighters: 0,
      pendingDocuments: 0,
      humanActionCases: 0,
    },
    urgentEvents: [],
    recentActivity: [],
  };
}
