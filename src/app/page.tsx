import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/server/services/session.service";

export default async function Home() {
  const user = await getAuthenticatedUser();

  redirect(user ? "/dashboard" : "/auth");
}
