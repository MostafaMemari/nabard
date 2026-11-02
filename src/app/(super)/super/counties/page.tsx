import { Suspense } from "react";
import { SuperShell } from "@/components/layout/super-shell";
import { SuperCountiesScreen } from "@/features/counties";

export default function SuperCountiesPage() {
  return (
    <SuperShell active="counties">
      <Suspense fallback={null}>
        <SuperCountiesScreen />
      </Suspense>
    </SuperShell>
  );
}
