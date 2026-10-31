import { CoachShell } from "@/components/layout/coach-shell";
import { EmptyState, PageHeader } from "@/components/shared";
import { demoCoach } from "@/lib/demo";

export default function CoachHomePage() {
  return (
    <CoachShell active="home" user={demoCoach}>
      <PageHeader title="خانه" description="نمای کلی مسابقات باز و ثبت‌نام‌های من." />
      <section className="rounded-xl border border-border bg-card shadow-card">
        <EmptyState title="این بخش به‌زودی تکمیل می‌شود." />
      </section>
    </CoachShell>
  );
}
