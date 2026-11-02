import { Suspense } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { ScreenSpinner } from "@/components/shared";
import { TransfersScreen } from "@/features/transfers";

export default function TransferRequestsPage() {
  return (
    <AdminShell active="transfer-requests">
      <Suspense fallback={<ScreenSpinner />}>
        <TransfersScreen />
      </Suspense>
    </AdminShell>
  );
}
