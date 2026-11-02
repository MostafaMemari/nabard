import { AdminShell } from "@/components/layout/admin-shell";
import { TransfersScreen } from "@/features/transfers";

export default function TransferRequestsPage() {
  return (
    <AdminShell active="transfer-requests">
      <TransfersScreen />
    </AdminShell>
  );
}
