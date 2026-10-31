import { AdminShell } from "@/components/layout/admin-shell";
import { EmptyState, PageHeader } from "@/components/shared";
import { demoAdmin } from "@/lib/demo";

export default function AdminCoachesPage() {
  return (
    <AdminShell active="coaches" user={demoAdmin}>
      <PageHeader title="مربیان" description="فهرست مربیان و هنرجویان هر مربی." />
      <section className="rounded-xl border border-border bg-card shadow-card">
        <EmptyState title="هنوز مربی‌ای اضافه نشده است." />
      </section>
    </AdminShell>
  );
}
