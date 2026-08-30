import type { HumanActionPriority } from "@/features/dashboard/data/promoter-events";

export function HumanActionPriorityBadge({
  priority,
}: {
  priority: HumanActionPriority;
}) {
  const styles =
    priority === "critical"
      ? "border-[#ffc2c2] bg-[#fff0f0] text-danger"
      : priority === "high"
        ? "border-[#ffd38f] bg-[#fff6e5] text-[#dc7d09]"
        : priority === "medium"
          ? "border-[#c9d9ff] bg-[#edf3ff] text-brand"
          : "border-border-subtle bg-panel-muted text-text-body";

  return (
    <span
      className={`inline-flex rounded-[10px] border px-3 py-1 text-sm font-medium capitalize ${styles}`}
    >
      {priority}
    </span>
  );
}
