import { AdminShell } from "@/components/layout/admin-shell";
import { CoachDetailScreen } from "@/features/users";

export default async function AdminCoachPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AdminShell active="coaches">
      <CoachDetailScreen coachId={id} />
    </AdminShell>
  );
}
