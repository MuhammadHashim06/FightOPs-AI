import { redirect } from "next/navigation";

import { getDashboardPathForRole } from "@/features/dashboard/lib/dashboard-routes";
import { getAuthenticatedUser } from "@/server/services/session.service";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/auth/sign-in?redirectTo=/dashboard");
  }

  redirect(getDashboardPathForRole(user.role));
}
