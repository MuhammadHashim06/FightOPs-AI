import type { AuthRole, AuthUser } from "@/types/auth";
import type { EventRecord } from "@/types/event";

export function hasAnyRole(user: AuthUser, roles: AuthRole[]) {
  return roles.includes(user.role);
}

export function canAccessEvent(user: AuthUser, event: EventRecord) {
  return user.role === "admin" ||
    (user.role === "promoter" && event.createdByUserId === user.id);
}
