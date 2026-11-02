import { Suspense } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { ScreenSpinner } from "@/components/shared";
import { RefundsScreen } from "@/features/refunds";

export default function AdminRefundsPage() {
  return (
    <AdminShell active="refunds">
      <Suspense fallback={<ScreenSpinner />}>
        <RefundsScreen />
      </Suspense>
    </AdminShell>
  );
}
