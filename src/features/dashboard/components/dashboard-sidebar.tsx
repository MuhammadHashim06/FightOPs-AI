"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/features/dashboard/components/logout-button";
import type { SafeAuthUser } from "@/types/auth";

type DashboardSidebarProps = {
  user: SafeAuthUser;
};

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const basePath = `/dashboard/${user.role}`;
  const primaryNavItems = [
    {
      href: basePath,
      label: "Overview",
      icon: OverviewIcon,
    },
    {
      href: `${basePath}/events`,
      label: "Events",
      icon: CalendarIcon,
    },
    {
      href: `${basePath}/human-action`,
      label: "Human Action",
      icon: AlertIcon,
    },
    {
      href: `${basePath}/documents`,
      label: "Documents",
      icon: FolderIcon,
    },
    {
      href: `${basePath}/activity-logs`,
      label: "Activity Logs",
      icon: ActivityIcon,
    },
  ];
  const settingsNavItems = [
    {
      href: `${basePath}/settings`,
      label: "Settings",
      icon: SettingsIcon,
    },
  ];

  return (
    <aside className="sticky top-0 flex h-screen w-[250px] shrink-0 flex-col overflow-hidden rounded-r-[24px] border-r border-border-subtle bg-sidebar shadow-[var(--shadow-soft)]">
      <div className="shrink-0 border-b border-border-subtle px-4 py-4">
        <div className="flex h-13 items-center justify-center rounded-[14px] bg-[#05070b] px-4">
          <Image
            src="/brand/logo.png"
            alt="FightOps AI"
            width={170}
            height={42}
            className="h-auto w-[170px] object-contain"
            priority
          />
        </div>
      </div>

      <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5">
        <div className="flex flex-col">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
            FightOps AI
          </p>
          <nav className="mt-3 flex flex-col gap-1.5">
            {primaryNavItems.map((item) => {
              const isActive =
                item.href === basePath
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3 rounded-[12px] border border-transparent px-4 py-3 text-[15px] font-medium outline-none transition focus-visible:outline-none ${
                    isActive
                      ? "bg-sidebar-accent text-brand"
                      : "text-text-body hover:bg-panel-muted hover:text-text-strong"
                  }`}
                >
                  {isActive ? (
                    <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-brand" />
                  ) : null}
                  <item.icon
                    className={`h-5 w-5 ${
                      isActive ? "text-brand" : "text-text-body group-hover:text-text-strong"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-6">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
            Settings
          </p>
          <nav className="mt-3 flex flex-col gap-1.5">
            {settingsNavItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3 rounded-[12px] border border-transparent px-4 py-3 text-[15px] font-medium outline-none transition focus-visible:outline-none ${
                    isActive
                      ? "bg-sidebar-accent text-brand"
                      : "text-text-body hover:bg-panel-muted hover:text-text-strong"
                  }`}
                >
                  {isActive ? (
                    <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-brand" />
                  ) : null}
                  <item.icon
                    className={`h-5 w-5 ${
                      isActive ? "text-brand" : "text-text-body group-hover:text-text-strong"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="shrink-0 border-t border-border-subtle px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-panel-strong text-text-body">
            <UserIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-text-strong">
              {user.profile.displayName}
            </p>
            <p className="text-sm text-text-muted capitalize">{user.role}</p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}

type IconProps = {
  className?: string;
};

function OverviewIcon({ className }: IconProps) {
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
      <rect x="4" y="4" width="6" height="6" rx="1.2" />
      <rect x="14" y="4" width="6" height="6" rx="1.2" />
      <rect x="4" y="14" width="6" height="6" rx="1.2" />
      <rect x="14" y="14" width="6" height="6" rx="1.2" />
    </svg>
  );
}

function CalendarIcon({ className }: IconProps) {
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
      <path d="M7 3v4" />
      <path d="M17 3v4" />
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16" />
    </svg>
  );
}

function AlertIcon({ className }: IconProps) {
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
      <path d="M12 4 3.8 18.2A1.3 1.3 0 0 0 5 20h14a1.3 1.3 0 0 0 1.2-1.8L12 4Z" />
      <path d="M12 9v4" />
      <circle cx="12" cy="16.5" r=".6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FolderIcon({ className }: IconProps) {
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
      <path d="M3.8 7.8A1.8 1.8 0 0 1 5.6 6h4l1.8 2h7a1.8 1.8 0 0 1 1.8 1.8v7.6a1.8 1.8 0 0 1-1.8 1.8H5.6a1.8 1.8 0 0 1-1.8-1.8V7.8Z" />
    </svg>
  );
}

function ActivityIcon({ className }: IconProps) {
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
      <path d="M12 6v6l4 2" />
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

function SettingsIcon({ className }: IconProps) {
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
      <path d="M12 8.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1.2 1.2 0 0 1 0 1.7l-1.2 1.2a1.2 1.2 0 0 1-1.7 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9v.2a1.2 1.2 0 0 1-1.2 1.2h-1.7a1.2 1.2 0 0 1-1.2-1.2v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1.2 1.2 0 0 1-1.7 0l-1.2-1.2a1.2 1.2 0 0 1 0-1.7l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H3.9a1.2 1.2 0 0 1-1.2-1.2v-1.7a1.2 1.2 0 0 1 1.2-1.2h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1.2 1.2 0 0 1 0-1.7l1.2-1.2a1.2 1.2 0 0 1 1.7 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9v-.2A1.2 1.2 0 0 1 10.4 3h1.7a1.2 1.2 0 0 1 1.2 1.2v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1.2 1.2 0 0 1 1.7 0l1.2 1.2a1.2 1.2 0 0 1 0 1.7l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2a1.2 1.2 0 0 1 1.2 1.2v1.7a1.2 1.2 0 0 1-1.2 1.2h-.2a1 1 0 0 0-.9.6Z" />
    </svg>
  );
}

function UserIcon({ className }: IconProps) {
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
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5.5 18.5a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}
