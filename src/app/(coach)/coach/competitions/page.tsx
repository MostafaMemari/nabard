import { CoachCompetitionsScreen } from "@/components/coach/coach-competitions-screen";
import { CoachShell } from "@/components/layout/coach-shell";

export default function CoachCompetitionsPage() {
  return (
    <CoachShell active="competitions">
      <CoachCompetitionsScreen />
    </CoachShell>
  );
}
