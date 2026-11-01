import { AdminShell } from "@/components/layout/admin-shell";
import { AdminReviewDetailScreen } from "@/features/students";

export default async function AdminProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AdminShell active="profiles">
      <AdminReviewDetailScreen studentId={id} />
    </AdminShell>
  );
}
