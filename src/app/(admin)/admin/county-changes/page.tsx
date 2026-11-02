import { Suspense } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { ScreenSpinner } from "@/components/shared";
import { CountyChangesScreen } from "@/features/county-changes";

export default function CountyChangesPage() {
  return (
    <AdminShell active="county-changes">
      <Suspense fallback={<ScreenSpinner />}>
        <CountyChangesScreen />
      </Suspense>
    </AdminShell>
  );
}
