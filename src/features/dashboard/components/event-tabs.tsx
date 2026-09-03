import Link from "next/link";

export const eventTabLabels = [
  "Fight Card",
  "Fighters",
  "Event Readiness",
  "Required Documents",
  "Post Reminders",
] as const;

export type EventTabLabel = (typeof eventTabLabels)[number];

export function EventTabs({
  eventSlug,
  activeTab,
  tabs = eventTabLabels,
}: {
  eventSlug: string;
  activeTab: string;
  tabs?: readonly string[];
}) {
  return (
    <nav
      aria-label="Event sections"
      className="flex flex-wrap gap-8 border-b border-border-subtle"
    >
      {tabs.map((tab) => {
        const href = getEventTabHref(eventSlug, tab);
        const className = `border-b-2 px-3 pb-3 text-[15px] font-medium transition ${
          tab === activeTab
            ? "border-brand text-brand"
            : "border-transparent text-text-body hover:text-text-strong"
        }`;

        if (href) {
          return (
            <Link
              key={tab}
              href={href}
              className={className}
              aria-current={tab === activeTab ? "page" : undefined}
            >
              {tab}
            </Link>
          );
        }

        return (
          <button key={tab} type="button" className={className}>
            {tab}
          </button>
        );
      })}
    </nav>
  );
}

function getEventTabHref(eventSlug: string, tab: string) {
  if (tab === "Fight Card") {
    return `/dashboard/promoter/events/${eventSlug}`;
  }

  if (tab === "Fighters") {
    return `/dashboard/promoter/events/${eventSlug}/fighters`;
  }

  if (tab === "Event Readiness") {
    return `/dashboard/promoter/events/${eventSlug}/readiness`;
  }

  if (tab === "Required Documents") {
    return `/dashboard/promoter/events/${eventSlug}/requirements`;
  }

  if (tab === "Post Reminders") {
    return `/dashboard/promoter/events/${eventSlug}/post-reminders`;
  }

  return undefined;
}
