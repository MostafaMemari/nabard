import { CoachRegistrationsScreen } from "@/components/coach/coach-registrations-screen";
import { CoachShell } from "@/components/layout/coach-shell";
import { demoCoach } from "@/lib/demo";

export default function CoachRegistrationsPage() {
  return (
    <CoachShell active="registrations" user={demoCoach}>
      <CoachRegistrationsScreen coachId={demoCoach.id} />
    </CoachShell>
  );
}
