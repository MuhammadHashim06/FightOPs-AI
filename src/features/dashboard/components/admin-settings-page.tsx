import Link from "next/link";

import type { getAdminPlatformSettings } from "@/server/services/admin.service";
import { PromoterSettingsPage } from "@/features/dashboard/components/promoter-settings-page";
import type { RequirementTemplateRecord } from "@/types/readiness";
import type { SafeAuthUser } from "@/types/auth";

type AdminPlatformSettings = Awaited<ReturnType<typeof getAdminPlatformSettings>>;

export function AdminSettingsPage({
  user,
  data,
  templates,
}: {
  user: SafeAuthUser;
  data: AdminPlatformSettings;
  templates: RequirementTemplateRecord[];
}) {
  return (
    <div className="space-y-6">
      <main className="space-y-5">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
            Platform administration
          </p>
          <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
            Admin Settings
          </h1>
          <p className="text-lg text-text-body">
            Monitor platform configuration and manage operational defaults.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-3">
          <AccountCard label="Admins" value={data.accountCounts.admins} />
          <AccountCard label="Promoters" value={data.accountCounts.promoters} />
          <AccountCard label="Fighters" value={data.accountCounts.fighters} />
        </section>

        <section className="rounded-[18px] border border-border-subtle bg-panel shadow-[var(--shadow-card)]">
          <div className="border-b border-border-subtle px-5 py-4">
            <h2 className="text-[18px] font-semibold text-text-strong">Platform integrations</h2>
            <p className="mt-1 text-sm text-text-muted">
              Environment: <span className="capitalize">{data.environment}</span>. Secrets are never shown here.
            </p>
          </div>
          <div className="divide-y divide-border-subtle">
            {data.integrations.map((integration) => (
              <div key={integration.name} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-text-strong">{integration.name}</p>
                  <p className="mt-1 text-sm text-text-muted">{integration.detail}</p>
                </div>
                <span className={`inline-flex w-fit rounded-[10px] border px-3 py-1 text-sm font-medium ${integration.ready ? "border-success-border bg-success-surface text-success" : "border-warning-border bg-warning-surface text-warning"}`}>
                  {integration.ready ? "Ready" : "Needs setup"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[18px] border border-border-subtle bg-panel p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-[18px] font-semibold text-text-strong">Operations</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/dashboard/admin/events" className={linkClassName}>View events</Link>
            <Link href="/dashboard/admin/documents" className={linkClassName}>Review documents</Link>
            <Link href="/dashboard/admin/human-action" className={linkClassName}>Review human action</Link>
            <Link href="/dashboard/admin/activity-logs" className={linkClassName}>View audit logs</Link>
          </div>
        </section>
      </main>

      <PromoterSettingsPage user={user} initialTemplates={templates} />
    </div>
  );
}

function AccountCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-[18px] border border-border-subtle bg-panel p-5 shadow-[var(--shadow-card)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p className="mt-3 text-[32px] font-semibold text-text-strong">{value}</p>
      <p className="mt-1 text-sm text-text-muted">Active accounts</p>
    </article>
  );
}

const linkClassName =
  "inline-flex h-10 items-center justify-center rounded-[10px] border border-border-subtle bg-panel px-4 text-sm font-medium text-text-strong transition hover:bg-panel-muted";
