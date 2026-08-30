import type { AuthRole } from "@/types/auth";

export const roleDashboardPaths: Record<AuthRole, string> = {
  promoter: "/dashboard/promoter",
  admin: "/dashboard/admin",
  fighter: "/dashboard/fighter",
};

export const roleDashboardSegments = new Set<AuthRole>([
  "promoter",
  "admin",
  "fighter",
]);

export function getDashboardPathForRole(role: AuthRole) {
  return roleDashboardPaths[role];
}

export function getDashboardRoleFromPathname(pathname: string) {
  const [, dashboardSegment, roleSegment] = pathname.split("/");

  if (dashboardSegment !== "dashboard") {
    return null;
  }

  if (!roleSegment || !roleDashboardSegments.has(roleSegment as AuthRole)) {
    return null;
  }

  return roleSegment as AuthRole;
}
