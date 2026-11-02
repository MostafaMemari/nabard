import { Suspense } from "react";
import { SuperShell } from "@/components/layout/super-shell";
import { ScreenSpinner } from "@/components/shared";
import { SuperHomeScreen } from "@/features/super";

export default function SuperHomePage() {
  return (
    <SuperShell active="home">
      <Suspense fallback={<ScreenSpinner />}>
        <SuperHomeScreen />
      </Suspense>
    </SuperShell>
  );
}
