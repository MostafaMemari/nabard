import { CoachShell } from "@/components/layout/coach-shell";
import { StudentFormScreen } from "@/features/students";
import { demoCoach } from "@/lib/demo";

export default async function CoachStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <CoachShell active="students" user={demoCoach}>
      <StudentFormScreen coachId={demoCoach.id} studentId={id} />
    </CoachShell>
  );
}
