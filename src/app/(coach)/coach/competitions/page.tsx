import { CoachShell } from "@/components/layout/coach-shell";
import { EmptyState, PageHeader } from "@/components/shared";
import { demoCoach } from "@/lib/demo";

export default function CoachCompetitionsPage() {
  return (
    <CoachShell active="competitions" user={demoCoach}>
      <PageHeader title="مسابقات" description="مسابقات باز برای ثبت‌نام هنرجویان." />
      <section className="rounded-xl border border-border bg-card shadow-card">
        <EmptyState title="هنوز مسابقه‌ای ثبت نشده است." />
      </section>
    </CoachShell>
  );
}
