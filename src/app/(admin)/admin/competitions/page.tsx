import { AdminShell } from "@/components/layout/admin-shell";
import { EmptyState, PageHeader } from "@/components/shared";
import { demoAdmin } from "@/lib/demo";

export default function AdminCompetitionsPage() {
  return (
    <AdminShell active="competitions" user={demoAdmin}>
      <PageHeader title="مسابقات" description="مدیریت مسابقات و مهلت ثبت‌نام آن‌ها." />
      <section className="rounded-xl border border-border bg-card shadow-card">
        <EmptyState title="هنوز مسابقه‌ای ثبت نشده است." />
      </section>
    </AdminShell>
  );
}
