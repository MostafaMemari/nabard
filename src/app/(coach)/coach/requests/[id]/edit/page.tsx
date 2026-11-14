import { Suspense } from "react";
import { CoachShell } from "@/components/layout/coach-shell";
import { ScreenSpinner } from "@/components/shared";
import { RegistrationRequestEditScreen } from "@/features/students";

export default async function CoachRequestEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <CoachShell active="requests">
      <Suspense fallback={<ScreenSpinner />}>
        <RegistrationRequestEditScreen requestId={id} />
      </Suspense>
    </CoachShell>
  );
}
