import { Suspense } from "react";
import { CoachShell } from "@/components/layout/coach-shell";
import { StudentsScreen } from "@/features/students";

export default function CoachStudentsPage() {
  return (
    <CoachShell active="students">
      <Suspense fallback={null}>
        <StudentsScreen />
      </Suspense>
    </CoachShell>
  );
}
