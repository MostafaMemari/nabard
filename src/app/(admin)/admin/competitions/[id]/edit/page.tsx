import { AdminShell } from "@/components/layout/admin-shell";
import { CompetitionFormScreen } from "@/features/competitions";
import { demoAdmin } from "@/lib/demo";

export default async function AdminEditCompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AdminShell active="competitions" user={demoAdmin}>
      <CompetitionFormScreen competitionId={id} />
    </AdminShell>
  );
}
