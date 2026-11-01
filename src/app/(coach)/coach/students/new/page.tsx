import { CoachShell } from "@/components/layout/coach-shell";
import { StudentFormScreen } from "@/features/students";

export default function CoachNewStudentPage() {
  return (
    <CoachShell active="students">
      <StudentFormScreen />
    </CoachShell>
  );
}
