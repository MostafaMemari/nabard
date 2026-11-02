import { Suspense } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { ScreenSpinner } from "@/components/shared";
import { PaymentsScreen } from "@/features/payments";

export default function AdminPaymentsPage() {
  return (
    <AdminShell active="payments">
      <Suspense fallback={<ScreenSpinner />}>
        <PaymentsScreen />
      </Suspense>
    </AdminShell>
  );
}
