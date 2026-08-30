import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { toSafeAuthUser } from "@/server/services/auth-presenter";
import { getAuthenticatedUser } from "@/server/services/session.service";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/auth/sign-in?redirectTo=/dashboard");
  }

  return <DashboardShell user={toSafeAuthUser(user)}>{children}</DashboardShell>;
}
