import { CoachShell } from "@/components/layout/coach-shell";
import { StudentProfileScreen } from "@/features/students";

export default async function CoachStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <CoachShell active="students">
      <StudentProfileScreen studentId={id} />
    </CoachShell>
  );
}
