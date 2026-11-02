import { Suspense } from "react";
import { SuperShell } from "@/components/layout/super-shell";
import { ScreenSpinner } from "@/components/shared";
import { SuperCountiesScreen } from "@/features/counties";

export default function SuperCountiesPage() {
  return (
    <SuperShell active="counties">
      <Suspense fallback={<ScreenSpinner />}>
        <SuperCountiesScreen />
      </Suspense>
    </SuperShell>
  );
}
