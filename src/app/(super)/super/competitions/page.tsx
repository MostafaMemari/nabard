import { Suspense } from "react";
import { SuperShell } from "@/components/layout/super-shell";
import { ScreenSpinner } from "@/components/shared";
import { SuperCompetitionsScreen } from "@/features/super";

export default function SuperCompetitionsPage() {
  return (
    <SuperShell active="competitions">
      <Suspense fallback={<ScreenSpinner />}>
        <SuperCompetitionsScreen />
      </Suspense>
    </SuperShell>
  );
}
