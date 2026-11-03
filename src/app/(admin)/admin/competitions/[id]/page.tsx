import { AdminShell } from "@/components/layout/admin-shell";
import { CompetitionDetailScreen } from "@/features/competitions";
import { demoAdmin } from "@/lib/demo";

export default async function AdminCompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AdminShell active="competitions" user={demoAdmin}>
      <CompetitionDetailScreen competitionId={id} />
    </AdminShell>
  );
}
