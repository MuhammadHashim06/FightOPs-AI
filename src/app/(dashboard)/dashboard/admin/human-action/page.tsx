import { RoleSectionPlaceholder } from "@/features/dashboard/components/role-section-placeholder";

export default function AdminHumanActionPage() {
  return (
    <RoleSectionPlaceholder
      eyebrow="Admin"
      title="Human action"
      description="Review escalated decisions, moderation queues, and any manual checks that require administrative approval."
    />
  );
}
