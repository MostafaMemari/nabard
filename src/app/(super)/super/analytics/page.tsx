import { Suspense } from "react";
import { SuperShell } from "@/components/layout/super-shell";
import { ScreenSpinner } from "@/components/shared";
import { SuperAnalyticsScreen } from "@/features/analytics";

export default function SuperAnalyticsPage() {
  return (
    <SuperShell active="analytics">
      <Suspense fallback={<ScreenSpinner />}>
        <SuperAnalyticsScreen />
      </Suspense>
    </SuperShell>
  );
}
