import { Suspense } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { RefundsScreen } from "@/features/refunds";

export default function AdminRefundsPage() {
  return (
    <AdminShell active="refunds">
      <Suspense fallback={null}>
        <RefundsScreen />
      </Suspense>
    </AdminShell>
  );
}
