import { AdminShell } from "@/components/layout/admin-shell";
import { CompetitionDetailScreen } from "@/features/competitions";

export default async function AdminCompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AdminShell active="competitions">
      <CompetitionDetailScreen competitionId={id} />
    </AdminShell>
  );
}
