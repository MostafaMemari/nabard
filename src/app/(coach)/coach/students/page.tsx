import { Suspense } from "react";
import { CoachShell } from "@/components/layout/coach-shell";
import { ScreenSpinner } from "@/components/shared";
import { StudentsScreen } from "@/features/students";

export default function CoachStudentsPage() {
  return (
    <CoachShell active="students">
      <Suspense fallback={<ScreenSpinner />}>
        <StudentsScreen />
      </Suspense>
    </CoachShell>
  );
}
