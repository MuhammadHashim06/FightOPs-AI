import type { HumanActionPriority } from "@/features/dashboard/data/promoter-events";

export function HumanActionPriorityBadge({
  priority,
}: {
  priority: HumanActionPriority;
}) {
  const styles =
    priority === "critical"
      ? "border-danger-border bg-danger-surface text-danger"
      : priority === "high"
        ? "border-warning-border bg-warning-surface text-warning"
        : priority === "medium"
          ? "border-brand-border bg-brand-surface-strong text-brand"
          : "border-border-subtle bg-panel-muted text-text-body";

  return (
    <span
      className={`inline-flex rounded-[10px] border px-3 py-1 text-sm font-medium capitalize ${styles}`}
    >
      {priority}
    </span>
  );
}
