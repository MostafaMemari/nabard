import { AdminShell } from "@/components/layout/admin-shell";
import { EmptyState, PageHeader } from "@/components/shared";
import { demoAdmin } from "@/lib/demo";

export default function AdminPaymentsPage() {
  return (
    <AdminShell active="payments" user={demoAdmin}>
      <PageHeader title="بررسی پرداخت‌ها" description="بررسی و تأیید رسیدهای پرداخت مربیان." />
      <section className="rounded-xl border border-border bg-card shadow-card">
        <EmptyState title="پرداختی برای بررسی وجود ندارد." />
      </section>
    </AdminShell>
  );
}
