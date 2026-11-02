import { CoachShell } from "@/components/layout/coach-shell";
import { StudentFormScreen } from "@/features/students";
import { demoCoach } from "@/lib/demo";

export default function CoachNewStudentPage() {
  return (
    <CoachShell active="students" user={demoCoach}>
      <StudentFormScreen coachId={demoCoach.id} />
    </CoachShell>
  );
}
