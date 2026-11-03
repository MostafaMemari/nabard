import { CoachCompetitionsScreen } from "@/components/coach/coach-competitions-screen";
import { CoachShell } from "@/components/layout/coach-shell";
import { demoCoach } from "@/lib/demo";

export default function CoachCompetitionsPage() {
  return (
    <CoachShell active="competitions" user={demoCoach}>
      <CoachCompetitionsScreen />
    </CoachShell>
  );
}
