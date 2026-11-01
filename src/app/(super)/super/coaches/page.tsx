import { Suspense } from "react";
import { SuperShell } from "@/components/layout/super-shell";
import { SuperCoachesScreen } from "@/features/super";

export default function SuperCoachesPage() {
  return (
    <SuperShell active="coaches">
      <Suspense fallback={null}>
        <SuperCoachesScreen />
      </Suspense>
    </SuperShell>
  );
}
