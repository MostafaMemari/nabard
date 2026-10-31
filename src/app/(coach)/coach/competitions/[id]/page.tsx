import { CoachCompetitionDetailScreen } from "@/components/coach/coach-competition-detail-screen";
import { CoachShell } from "@/components/layout/coach-shell";
import { demoCoach } from "@/lib/demo";

export default async function CoachCompetitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <CoachShell active="competitions" user={demoCoach}>
      <CoachCompetitionDetailScreen competitionId={id} />
    </CoachShell>
  );
}
