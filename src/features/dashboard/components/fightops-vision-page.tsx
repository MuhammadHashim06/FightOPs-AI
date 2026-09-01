const operationModules = [
  {
    title: "Matchmaking and sourcing",
    description:
      "Track fighter shortlists, availability, opponent fit, contact status, and promoter decisions before a bout is confirmed.",
    status: "Planned",
  },
  {
    title: "Contracting",
    description:
      "Send contracts right after fight scheduling, collect signed copies, route promoter approval, and unlock the next requirements only after confirmation.",
    status: "In progress",
  },
  {
    title: "Fighter operations",
    description:
      "Coordinate fighter profiles, manager contacts, onboarding invites, requirement status, and readiness checkpoints in one timeline.",
    status: "In progress",
  },
  {
    title: "Medical and regulatory",
    description:
      "Collect medical clearance, licenses, IDs, insurance, and compliance documents with AI extraction plus human review when confidence is low.",
    status: "In progress",
  },
  {
    title: "Visa and invitations",
    description:
      "Prepare invitation letters, track passport details, visa deadlines, embassy steps, and escalations before travel risk becomes urgent.",
    status: "Next",
  },
  {
    title: "Travel operations",
    description:
      "Capture arrival and departure dates, flight times, airport details, itineraries, and reminder history for every fighter team.",
    status: "Next",
  },
  {
    title: "Accommodation",
    description:
      "Track hotel assignments, check-in windows, rooming notes, transport dependencies, and unresolved logistics tasks.",
    status: "Planned",
  },
  {
    title: "Weight and weigh-in",
    description:
      "Monitor weight class, weigh-in timing, evidence collection, exceptions, and final clearance before fight night.",
    status: "Planned",
  },
  {
    title: "Finance operations",
    description:
      "Track payment milestones, bonuses, deductions, receipts, and finance approvals tied to contract and event status.",
    status: "Planned",
  },
  {
    title: "Media and broadcast",
    description:
      "Collect headshots, bios, walkout assets, broadcast notes, media approvals, and missing promotional material.",
    status: "Planned",
  },
  {
    title: "Event operations",
    description:
      "Give promoters a live command center across fights, readiness, late blockers, reminders, and human decisions.",
    status: "In progress",
  },
  {
    title: "Post-event operations",
    description:
      "Close out payments, medical follow-ups, reports, media deliverables, audit logs, and promoter review tasks.",
    status: "Planned",
  },
];

const automationSteps = [
  "Fight scheduled",
  "Contract sent",
  "Fighter accepts invite",
  "Signed agreement approved",
  "Requirements unlocked",
  "Daily reminders sent",
  "Documents reviewed",
  "Exceptions escalated",
];

const humanControls = [
  "Approve or reject signed contracts before remaining requirements unlock.",
  "Review documents when AI confidence is low or information conflicts with fighter records.",
  "Override deadlines, reminder rules, and event-specific requirement templates.",
  "Remove, re-invite, or replace fighters when onboarding stalls before a deadline.",
];

const statusStyles = {
  "In progress": "border-[#b7cdfd] bg-[#edf4ff] text-brand",
  Next: "border-[#fde2a8] bg-[#fff7e8] text-warning",
  Planned: "border-border-subtle bg-panel-muted text-text-body",
};

export function FightOpsVisionPage() {
  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-border-subtle bg-[#111f38] text-white shadow-[0_24px_60px_rgba(17,31,56,0.22)]">
        <div className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#91a7cf]">
              FightOps AI Vision
            </p>
            <h1 className="mt-3 max-w-[760px] text-[34px] font-semibold leading-tight tracking-tight sm:text-[46px]">
              The operating system for fight promotion workflows.
            </h1>
            <p className="mt-4 max-w-[720px] text-[17px] leading-7 text-[#c9d8f2]">
              FightOps AI should not just store documents. It should trigger the
              whole operational process after a fight is scheduled, keep reminders
              moving every day, and escalate only the decisions that need a human.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <HeroMetric label="Modules" value="12" />
              <HeroMetric label="Control points" value="4" />
              <HeroMetric label="Mode" value="Human-led" />
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/8 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#91a7cf]">
                  Operations Core
                </p>
                <h2 className="mt-2 text-[24px] font-semibold">
                  From scheduling to fight night
                </h2>
              </div>
              <span className="rounded-full border border-[#55d6b7]/40 bg-[#55d6b7]/12 px-3 py-1 text-xs font-semibold text-[#91ffe5]">
                AI monitored
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {automationSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-[16px] border border-white/10 bg-white/8 px-4 py-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-[#edf4ff]">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {humanControls.map((control) => (
          <article
            key={control}
            className="rounded-[18px] border border-border-subtle bg-panel p-5 shadow-[0_10px_24px_rgba(23,32,51,0.03)]"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] bg-sidebar-accent text-brand">
              <CheckIcon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-[15px] leading-6 text-text-body">{control}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[24px] border border-border-subtle bg-panel p-5 shadow-[0_12px_30px_rgba(23,32,51,0.04)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
              Product Map
            </p>
            <h2 className="mt-2 text-[28px] font-semibold tracking-tight text-text-strong">
              End-to-end operations modules
            </h2>
          </div>
          <p className="max-w-[540px] text-sm leading-6 text-text-body">
            These modules map the PRD vision into implementation areas. Current
            build focus stays on settings, events, fight onboarding, document
            collection, reminders, approvals, and audit trails.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {operationModules.map((module) => (
            <article
              key={module.title}
              className="rounded-[18px] border border-border-subtle bg-panel-muted p-5 transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(23,32,51,0.08)]"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[17px] font-semibold text-text-strong">
                  {module.title}
                </h3>
                <span
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                    statusStyles[module.status as keyof typeof statusStyles]
                  }`}
                >
                  {module.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-text-body">
                {module.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[22px] border border-border-subtle bg-panel p-5 shadow-[0_10px_24px_rgba(23,32,51,0.03)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
            Reminder Logic
          </p>
          <h2 className="mt-2 text-[24px] font-semibold text-text-strong">
            Daily until resolved, deadline aware
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-text-body">
            Requirements can be due by exact date, due in X days after scheduling
            or contract approval, or due X days before the event. Pending and
            rejected items keep receiving reminders; submitted or under-review
            items stop being included.
          </p>
        </article>

        <article className="rounded-[22px] border border-border-subtle bg-panel p-5 shadow-[0_10px_24px_rgba(23,32,51,0.03)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
            Document Storage
          </p>
          <h2 className="mt-2 text-[24px] font-semibold text-text-strong">
            R2-backed collection and audit trail
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-text-body">
            File uploads should move to Cloudflare R2 with metadata in MongoDB:
            who uploaded it, which fight and requirement it belongs to, current
            approval status, AI confidence, and every human decision in the audit
            log.
          </p>
        </article>
      </section>
    </main>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/8 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#91a7cf]">
        {label}
      </p>
      <p className="mt-2 text-[24px] font-semibold text-white">{value}</p>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}
