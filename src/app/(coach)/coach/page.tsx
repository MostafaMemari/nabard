import { CoachHomeScreen } from "@/components/coach/coach-home-screen";
import { CoachShell } from "@/components/layout/coach-shell";
import { demoCoach } from "@/lib/demo";

export default function CoachHomePage() {
  return (
    <CoachShell active="home" user={demoCoach}>
      <CoachHomeScreen coachId={demoCoach.id} />
    </CoachShell>
  );
}
