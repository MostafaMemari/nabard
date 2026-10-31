import { CoachShell } from "@/components/layout/coach-shell";
import { EmptyState, PageHeader } from "@/components/shared";
import { demoCoach } from "@/lib/demo";

export default function CoachRegistrationsPage() {
  return (
    <CoachShell active="registrations" user={demoCoach}>
      <PageHeader title="ثبت‌نام‌های من" description="پیگیری وضعیت ثبت‌نام و پرداخت هنرجویان." />
      <section className="rounded-xl border border-border bg-card shadow-card">
        <EmptyState title="هنوز ثبت‌نامی انجام نشده است." />
      </section>
    </CoachShell>
  );
}
