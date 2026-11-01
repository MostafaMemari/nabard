import { CoachHomeScreen } from "@/components/coach/coach-home-screen";
import { CoachShell } from "@/components/layout/coach-shell";

export default function CoachHomePage() {
  return (
    <CoachShell active="home">
      <CoachHomeScreen />
    </CoachShell>
  );
}
