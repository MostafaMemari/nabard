import { CoachShell } from "@/components/layout/coach-shell";
import { StudentFormScreen } from "@/features/students";

export default async function CoachStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <CoachShell active="students">
      <StudentFormScreen studentId={id} />
    </CoachShell>
  );
}
