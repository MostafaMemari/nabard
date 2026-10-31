import { AdminShell } from "@/components/layout/admin-shell";
import { PaymentDetailScreen } from "@/features/payments";
import { demoAdmin } from "@/lib/demo";

export default async function AdminPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AdminShell active="payments" user={demoAdmin}>
      <PaymentDetailScreen paymentId={id} />
    </AdminShell>
  );
}
