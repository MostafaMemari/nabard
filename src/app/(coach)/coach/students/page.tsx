import { Suspense } from "react";
import { CoachShell } from "@/components/layout/coach-shell";
import { StudentsScreen } from "@/features/students";
import { demoCoach } from "@/lib/demo";

export default function CoachStudentsPage() {
  return (
    <CoachShell active="students" user={demoCoach}>
      <Suspense fallback={null}>
        <StudentsScreen coachId={demoCoach.id} />
      </Suspense>
    </CoachShell>
  );
}
