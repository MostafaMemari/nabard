import { AdminShell } from "@/components/layout/admin-shell";
import { EmptyState, PageHeader } from "@/components/shared";
import { demoAdmin } from "@/lib/demo";

export default function AdminHomePage() {
  return (
    <AdminShell active="home" user={demoAdmin}>
      <PageHeader title="خانه" description="نمای کلی مسابقات، پرداخت‌ها و مربیان." />
      <section className="rounded-xl border border-border bg-card shadow-card">
        <EmptyState title="این بخش به‌زودی تکمیل می‌شود." />
      </section>
    </AdminShell>
  );
}
