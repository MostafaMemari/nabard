import { Suspense } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { PaymentsScreen } from "@/features/payments";

export default function AdminPaymentsPage() {
  return (
    <AdminShell active="payments">
      <Suspense fallback={null}>
        <PaymentsScreen />
      </Suspense>
    </AdminShell>
  );
}
