import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getDashboardPathForRole } from "@/features/dashboard/lib/dashboard-routes";
import { getAuthenticatedUser } from "@/server/services/session.service";

export default async function PromoterDashboardLayout({ children }: { children: ReactNode }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/auth/sign-in?redirectTo=/dashboard/promoter");
  }

  if (user.role !== "promoter") {
    redirect(getDashboardPathForRole(user.role));
  }

  return children;
}
