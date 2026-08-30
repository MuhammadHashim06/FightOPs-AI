import type { ReactNode } from "react";

import { DashboardSidebar } from "@/features/dashboard/components/dashboard-sidebar";
import type { SafeAuthUser } from "@/types/auth";

export function DashboardShell({
  user,
  children,
}: {
  user: SafeAuthUser;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-app text-text-strong">
      <div className="flex min-h-screen w-full items-stretch">
        <DashboardSidebar user={user} />
        <div className="min-w-0 flex-1 px-6 py-5 pr-8 lg:px-8 lg:py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
