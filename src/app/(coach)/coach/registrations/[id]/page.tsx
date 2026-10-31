import { CoachRegistrationDetailScreen } from "@/components/coach/coach-registration-detail-screen";
import { CoachShell } from "@/components/layout/coach-shell";
import { demoCoach } from "@/lib/demo";

export default async function CoachRegistrationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <CoachShell active="registrations" user={demoCoach}>
      <CoachRegistrationDetailScreen coachId={demoCoach.id} registrationId={id} />
    </CoachShell>
  );
}
