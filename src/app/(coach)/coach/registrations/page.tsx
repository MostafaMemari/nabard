import { CoachRegistrationsScreen } from "@/components/coach/coach-registrations-screen";
import { CoachShell } from "@/components/layout/coach-shell";

export default function CoachRegistrationsPage() {
  return (
    <CoachShell active="registrations">
      <CoachRegistrationsScreen />
    </CoachShell>
  );
}
