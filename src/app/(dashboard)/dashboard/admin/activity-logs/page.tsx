import { RoleSectionPlaceholder } from "@/features/dashboard/components/role-section-placeholder";

export default function AdminActivityLogsPage() {
  return (
    <RoleSectionPlaceholder
      eyebrow="Admin"
      title="Activity logs"
      description="Inspect audit trails, recent updates, and system-level operations performed across the platform."
    />
  );
}
