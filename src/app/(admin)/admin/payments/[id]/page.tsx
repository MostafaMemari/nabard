import { AdminShell } from "@/components/layout/admin-shell";
import { PaymentDetailScreen } from "@/features/payments";

export default async function AdminPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AdminShell active="payments">
      <PaymentDetailScreen paymentId={id} />
    </AdminShell>
  );
}
