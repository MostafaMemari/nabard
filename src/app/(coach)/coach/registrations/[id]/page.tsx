import { CoachRegistrationDetailScreen } from "@/components/coach/coach-registration-detail-screen";
import { CoachShell } from "@/components/layout/coach-shell";

export default async function CoachRegistrationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <CoachShell active="registrations">
      <CoachRegistrationDetailScreen registrationId={id} />
    </CoachShell>
  );
}
