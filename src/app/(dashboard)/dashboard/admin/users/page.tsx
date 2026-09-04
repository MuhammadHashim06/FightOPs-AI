import { redirect } from "next/navigation";

import { AdminUsersPage } from "@/features/dashboard/components/admin-users-page";
import { getAdminUsersData } from "@/server/services/admin.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

export default async function AdminUsersRoute() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  if (user.role !== "admin") {
    redirect(`/dashboard/${user.role}`);
  }

  const users = await getAdminUsersData(user);

  return <AdminUsersPage users={users} />;
}
