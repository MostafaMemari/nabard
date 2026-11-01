import { AdminShell } from "@/components/layout/admin-shell";
import { CompetitionFormScreen } from "@/features/competitions";

export default async function AdminEditCompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AdminShell active="competitions">
      <CompetitionFormScreen competitionId={id} />
    </AdminShell>
  );
}
