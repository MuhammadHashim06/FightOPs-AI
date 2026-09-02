import type { DashboardEventDetail } from "@/server/services/events.service";

export function FightHeroCard({
  bout,
}: {
  bout: DashboardEventDetail["bouts"][number];
}) {
  return (
    <section className="overflow-hidden rounded-[18px] border border-border-subtle bg-panel shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3 border-b border-border-subtle px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-success" />
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-body">
            {bout.label} {bout.division}
          </p>
        </div>

        <div className="flex items-center gap-3 text-[15px] text-text-body">
          <span>Fight readiness</span>
          <div className="h-2 w-24 overflow-hidden rounded-full bg-brand-soft">
            <div
              className={`h-full rounded-full ${
                bout.readinessPercent === 100 ? "bg-success" : "bg-brand"
              }`}
              style={{ width: `${bout.readinessPercent}%` }}
            />
          </div>
          <span className="font-medium text-text-strong">{bout.readinessPercent}%</span>
        </div>
      </div>

      <div className="grid items-center gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] lg:px-6">
        <FighterPanel fighter={bout.leftFighter} side="left" />

        <div className="flex items-center justify-center self-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border-subtle bg-panel-muted text-2xl font-medium text-text-body">
            VS
          </div>
        </div>

        <FighterPanel fighter={bout.rightFighter} side="right" />
      </div>
    </section>
  );
}

function FighterPanel({
  fighter,
  side,
}: {
  fighter: DashboardEventDetail["bouts"][number]["leftFighter"];
  side: "left" | "right";
}) {
  const progressTone =
    fighter.readinessLabel === "Ready" ? "bg-success" : "bg-brand";

  return (
    <div
      className={`flex min-w-0 items-center gap-4 ${
        side === "right" ? "lg:flex-row-reverse lg:text-right" : ""
      }`}
    >
      <FighterAvatar name={fighter.name} />

      <div className="min-w-0 flex-1">
        <h3 className="text-[18px] font-semibold leading-tight text-text-strong">
          {fighter.name}
        </h3>
        <p className="mt-1 text-[15px] text-text-body">
          {fighter.division} - {fighter.country} - {fighter.stance}
        </p>
        <div
          className={`mt-4 h-1.5 w-full max-w-[360px] overflow-hidden rounded-full bg-panel-strong ${
            side === "right" ? "lg:ml-auto" : ""
          }`}
        >
          <div
            className={`h-full rounded-full ${progressTone}`}
            style={{ width: `${fighter.readinessPercent}%` }}
          />
        </div>
        <div
          className={`mt-4 flex flex-wrap gap-2 ${
            side === "right" ? "lg:justify-end" : ""
          }`}
        >
          {fighter.tags.map((tag) => (
            <StatusPill key={tag.label} label={tag.label} tone={tag.tone} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FighterAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <div className="flex h-[108px] w-[108px] shrink-0 items-end justify-center overflow-hidden rounded-[14px] [background:var(--avatar-gradient)]">
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 [background:var(--avatar-sheen)] text-text-inverse">
        <UserIcon className="h-8 w-8 opacity-80" />
        <span className="text-xl font-semibold">{initials || "F"}</span>
      </div>
    </div>
  );
}

function UserIcon({ className }: { className?: string }) {
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
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "neutral" | "processing";
}) {
  const styles =
    tone === "success"
      ? "bg-success-surface-strong text-success"
      : tone === "warning"
        ? "bg-warning-surface-muted text-warning"
        : tone === "processing"
          ? "bg-brand-surface-strong text-brand"
          : "bg-panel-muted text-text-body";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${styles}`}>
      {label}
    </span>
  );
}
