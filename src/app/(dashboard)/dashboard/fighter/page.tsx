import { FighterDashboardPage } from "@/features/dashboard/components/fighter-dashboard-page";
import { getFighterDashboardDataForUser } from "@/server/services/fighter-portal.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

export default async function FighterDashboardRoute() {
  const user = await getAuthenticatedUser();
  const dashboard = user
    ? await getFighterDashboardDataForUser(user)
    : null;

  return <FighterDashboardPage dashboard={dashboard ?? emptyDashboardState(user)} />;
}

function emptyDashboardState(
  user: Awaited<ReturnType<typeof getAuthenticatedUser>>,
) {
  return {
    fighterName: user?.profile.displayName ?? "Fighter",
    documentSummary: "0 of 0 verified",
    notificationSummary: "0 unread messages",
    supportSummary: "Operations team",
    upcomingFight: null,
    readiness: {
      percentage: 0,
      statusLabel: "Pending",
      required: 0,
      verified: 0,
      pending: 0,
      rejected: 0,
    },
  };
}
