import { Suspense } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { ScreenSpinner } from "@/components/shared";
import { ProvinceChangesScreen } from "@/features/province-changes";

export default function ProvinceChangesPage() {
  return (
    <AdminShell active="province-changes">
      <Suspense fallback={<ScreenSpinner />}>
        <ProvinceChangesScreen />
      </Suspense>
    </AdminShell>
  );
}
