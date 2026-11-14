import { Suspense } from "react";
import { CoachShell } from "@/components/layout/coach-shell";
import { ScreenSpinner } from "@/components/shared";
import { CoachRequestsScreen } from "@/features/requests";

export default function CoachRequestsPage() {
  return (
    <CoachShell active="requests">
      <Suspense fallback={<ScreenSpinner />}>
        <CoachRequestsScreen />
      </Suspense>
    </CoachShell>
  );
}
