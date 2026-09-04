"use client";

import { useMemo, useState } from "react";

import type { AdminUserData } from "@/server/services/admin.service";
import type { AuthRole } from "@/types/auth";

type RoleFilter = "all" | AuthRole;

export function AdminUsersPage({
  users,
}: {
  users: AdminUserData[];
}) {
  const [searchValue, setSearchValue] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const normalizedSearch = searchValue.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      if (!matchesRole) return false;

      if (!normalizedSearch) return true;

      return (
        user.displayName.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        user.firstName.toLowerCase().includes(normalizedSearch) ||
        user.lastName.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [users, roleFilter, normalizedSearch]);

  const counts = useMemo(() => {
    return {
      total: users.length,
      promoters: users.filter((u) => u.role === "promoter").length,
      fighters: users.filter((u) => u.role === "fighter").length,
      admins: users.filter((u) => u.role === "admin").length,
    };
  }, [users]);

  return (
    <main className="space-y-5">
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
          Platform operations
        </p>
        <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
          Users
        </h1>
        <p className="text-lg text-text-body">
          Monitor and manage user accounts and access roles across the platform.
        </p>
      </div>

      {/* Summary Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={counts.total} />
        <StatCard label="Promoters" value={counts.promoters} tone="brand" />
        <StatCard label="Fighters" value={counts.fighters} tone="success" />
        <StatCard label="Administrators" value={counts.admins} tone="warning" />
      </section>

      {/* Filters and Search Bar */}
      <section className="flex flex-col gap-3 rounded-[18px] border border-border-subtle bg-panel p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex h-11 flex-1 items-center gap-3 rounded-[12px] border border-border-subtle bg-panel-muted px-4 text-text-muted transition focus-within:border-brand-border focus-within:text-text-strong">
          <SearchIcon className="h-4 w-4 shrink-0" />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search by name or email address..."
            className="w-full bg-transparent text-[14px] text-text-strong outline-none placeholder:text-text-muted"
          />
          {searchValue ? (
            <button
              onClick={() => setSearchValue("")}
              className="text-xs text-text-muted transition hover:text-text-strong"
            >
              Clear
            </button>
          ) : null}
        </div>

        {/* Role Pills */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-[12px] bg-panel-muted p-1 border border-border-subtle">
          <RoleTab
            label="All"
            count={counts.total}
            active={roleFilter === "all"}
            onClick={() => setRoleFilter("all")}
          />
          <RoleTab
            label="Promoters"
            count={counts.promoters}
            active={roleFilter === "promoter"}
            onClick={() => setRoleFilter("promoter")}
          />
          <RoleTab
            label="Fighters"
            count={counts.fighters}
            active={roleFilter === "fighter"}
            onClick={() => setRoleFilter("fighter")}
          />
          <RoleTab
            label="Admins"
            count={counts.admins}
            active={roleFilter === "admin"}
            onClick={() => setRoleFilter("admin")}
          />
        </div>
      </section>

      {/* Users Table */}
      <section className="overflow-hidden rounded-[18px] border border-border-subtle bg-panel shadow-[var(--shadow-card)]">
        <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1.2fr_1.2fr] gap-4 border-b border-border-subtle px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted lg:grid">
          <span>User</span>
          <span>Role</span>
          <span>Status</span>
          <span>Email Verified</span>
          <span>Last Login</span>
          <span>Joined Date</span>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-lg font-medium text-text-strong">No users found</p>
            <p className="mt-1 text-sm text-text-muted">
              {searchValue || roleFilter !== "all"
                ? "Try adjusting your search criteria or role filters."
                : "There are currently no registered users."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="grid gap-3 px-6 py-4 transition hover:bg-panel-muted/50 lg:grid-cols-[2fr_1fr_1fr_1fr_1.2fr_1.2fr] lg:items-center lg:gap-4"
              >
                {/* User Info */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-brand">
                    {user.firstName ? user.firstName[0]?.toUpperCase() : "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-strong">
                      {user.displayName || `${user.firstName} ${user.lastName}`}
                    </p>
                    <p className="truncate text-xs text-text-muted">{user.email}</p>
                  </div>
                </div>

                {/* Role Badge */}
                <div>
                  <RoleBadge role={user.role} />
                </div>

                {/* Status Badge */}
                <div>
                  <StatusBadge status={user.status} />
                </div>

                {/* Email Verified */}
                <div className="text-xs text-text-muted">
                  {user.emailVerifiedAt ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
                      <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                      Unverified
                    </span>
                  )}
                </div>

                {/* Last Login */}
                <div className="text-xs text-text-muted">
                  {user.lastLoginAt ? (
                    formatDate(user.lastLoginAt)
                  ) : (
                    <span className="text-text-muted/60">Never</span>
                  )}
                </div>

                {/* Joined Date */}
                <div className="text-xs text-text-muted">
                  {formatDate(user.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function RoleTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-[9px] px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-panel text-brand shadow-sm"
          : "text-text-muted hover:text-text-strong"
      }`}
    >
      <span>{label}</span>
      <span
        className={`rounded-full px-1.5 py-0.2 text-[10px] ${
          active
            ? "bg-brand/10 text-brand"
            : "bg-panel text-text-muted"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function RoleBadge({ role }: { role: AuthRole }) {
  switch (role) {
    case "admin":
      return (
        <span className="inline-flex items-center rounded-[8px] bg-warning/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.05em] text-warning">
          Admin
        </span>
      );
    case "fighter":
      return (
        <span className="inline-flex items-center rounded-[8px] bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.05em] text-emerald-400">
          Fighter
        </span>
      );
    case "promoter":
    default:
      return (
        <span className="inline-flex items-center rounded-[8px] bg-brand/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.05em] text-brand">
          Promoter
        </span>
      );
  }
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Active
        </span>
      );
    case "suspended":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/15 px-2.5 py-0.5 text-xs font-medium text-danger">
          <span className="h-1.5 w-1.5 rounded-full bg-danger" />
          Suspended
        </span>
      );
    case "pending_verification":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
          Pending
        </span>
      );
  }
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "brand" | "success" | "warning";
}) {
  return (
    <div className="rounded-[18px] border border-border-subtle bg-panel p-5 shadow-[var(--shadow-card)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
        {label}
      </p>
      <p
        className={`mt-2 text-[32px] font-semibold ${
          tone === "brand"
            ? "text-brand"
            : tone === "success"
              ? "text-emerald-400"
              : tone === "warning"
                ? "text-warning"
                : "text-text-strong"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function formatDate(isoString: string) {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}
