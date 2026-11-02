import { Suspense } from "react";
import { SuperShell } from "@/components/layout/super-shell";
import { ScreenSpinner } from "@/components/shared";
import { SuperCoachesScreen } from "@/features/super";

export default function SuperCoachesPage() {
  return (
    <SuperShell active="coaches">
      <Suspense fallback={<ScreenSpinner />}>
        <SuperCoachesScreen />
      </Suspense>
    </SuperShell>
  );
}
