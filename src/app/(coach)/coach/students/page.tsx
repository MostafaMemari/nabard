import { CoachShell } from "@/components/layout/coach-shell";
import { EmptyState, PageHeader } from "@/components/shared";
import { demoCoach } from "@/lib/demo";

export default function CoachStudentsPage() {
  return (
    <CoachShell active="students" user={demoCoach}>
      <PageHeader title="هنرجویان" description="مدیریت هنرجویان باشگاه شما." />
      <section className="rounded-xl border border-border bg-card shadow-card">
        <EmptyState title="هنوز هنرجویی اضافه نکرده‌اید." />
      </section>
    </CoachShell>
  );
}
