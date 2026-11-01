import { Suspense } from "react";
import { SuperShell } from "@/components/layout/super-shell";
import { SuperCompetitionsScreen } from "@/features/super";

export default function SuperCompetitionsPage() {
  return (
    <SuperShell active="competitions">
      <Suspense fallback={null}>
        <SuperCompetitionsScreen />
      </Suspense>
    </SuperShell>
  );
}
