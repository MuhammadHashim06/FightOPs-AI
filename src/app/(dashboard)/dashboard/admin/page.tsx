import { RoleSectionPlaceholder } from "@/features/dashboard/components/role-section-placeholder";

export default function AdminDashboardPage() {
  return (
    <RoleSectionPlaceholder
      eyebrow="Admin"
      title="Admin dashboard"
      description="This area is reserved for platform-wide administration, approvals, access controls, and operational oversight."
    />
  );
}
