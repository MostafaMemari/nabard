import { RegistrationFlow } from "@/components/coach/registration-flow";
import { CoachShell } from "@/components/layout/coach-shell";
import { demoCoach } from "@/lib/demo";

export default async function CoachRegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <CoachShell active="competitions" user={demoCoach}>
      <RegistrationFlow competitionId={id} coachId={demoCoach.id} />
    </CoachShell>
  );
}
