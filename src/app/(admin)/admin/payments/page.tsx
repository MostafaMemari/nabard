import { Suspense } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { PaymentsScreen } from "@/features/payments";
import { demoAdmin } from "@/lib/demo";

export default function AdminPaymentsPage() {
  return (
    <AdminShell active="payments" user={demoAdmin}>
      <Suspense fallback={null}>
        <PaymentsScreen />
      </Suspense>
    </AdminShell>
  );
}
