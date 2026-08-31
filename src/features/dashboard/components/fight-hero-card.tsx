import type { DashboardEventDetail } from "@/server/services/events.service";

export function FightHeroCard({
  bout,
}: {
  bout: DashboardEventDetail["bouts"][number];
}) {
  return (
    <section className="overflow-hidden rounded-[18px] border border-border-subtle bg-panel shadow-[0_10px_24px_rgba(23,32,51,0.03)]">
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

      <div className="grid gap-6 px-5 py-5 lg:grid-cols-[1fr_auto_1fr] lg:px-6">
        <FighterPanel fighter={bout.leftFighter} side="left" />

        <div className="flex items-center justify-center">
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
      className={`grid gap-4 ${
        side === "right"
          ? "lg:grid-cols-[1fr_108px] lg:text-right"
          : "lg:grid-cols-[108px_1fr]"
      }`}
    >
      {side === "left" ? <FighterAvatar name={fighter.name} /> : null}

      <div className={side === "right" ? "order-1" : ""}>
        <h3 className="text-[18px] font-semibold text-text-strong">{fighter.name}</h3>
        <p className="mt-1 text-[15px] text-text-body">
          {fighter.division} - {fighter.country} - {fighter.stance}
        </p>
        <div
          className={`mt-4 h-1.5 overflow-hidden rounded-full bg-panel-strong ${
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

      {side === "right" ? <FighterAvatar name={fighter.name} /> : null}
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
    <div className="flex h-[110px] w-[110px] items-end justify-center overflow-hidden rounded-[14px] bg-[radial-gradient(circle_at_top,#365f95_0%,#12243f_45%,#0a1322_100%)]">
      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0))] text-2xl font-semibold text-white">
        {initials}
      </div>
    </div>
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
      ? "bg-[#e6f8ec] text-success"
      : tone === "warning"
        ? "bg-[#fff2d8] text-[#d97706]"
        : tone === "processing"
          ? "bg-[#edf3ff] text-brand"
          : "bg-panel-muted text-text-body";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${styles}`}>
      {label}
    </span>
  );
}
