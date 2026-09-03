import { PromoterEventsPage } from "@/features/dashboard/components/promoter-events-page";
import { listPromoterDashboardEvents } from "@/server/services/events.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

export default async function PromoterEventsRoute({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getAuthenticatedUser();
  const { q = "" } = await searchParams;
  const normalizedQuery = q.trim().toLowerCase();
  const allEvents = user ? await listPromoterDashboardEvents(user) : [];
  const events = normalizedQuery
    ? allEvents.filter((event) =>
        [event.name, event.location, event.status].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        ),
      )
    : allEvents;

  return <PromoterEventsPage events={events} searchQuery={q} />;
}
