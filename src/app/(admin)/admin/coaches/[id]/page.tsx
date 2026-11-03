import { AdminShell } from "@/components/layout/admin-shell";
import { CoachDetailScreen } from "@/features/users";
import { demoAdmin } from "@/lib/demo";

export default async function AdminCoachPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AdminShell active="coaches" user={demoAdmin}>
      <CoachDetailScreen coachId={id} />
    </AdminShell>
  );
}
