import { Suspense } from "react";
import { SuperShell } from "@/components/layout/super-shell";
import { ScreenSpinner } from "@/components/shared";
import { BaseDataScreen } from "@/features/base-data";

export default function SuperBaseDataPage() {
  return (
    <SuperShell active="base-data">
      <Suspense fallback={<ScreenSpinner />}>
        <BaseDataScreen />
      </Suspense>
    </SuperShell>
  );
}
