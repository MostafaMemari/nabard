import { RegistrationFlow } from "@/components/coach/registration-flow";
import { CoachShell } from "@/components/layout/coach-shell";
import { FormContainer } from "@/components/shared";

export default async function CoachRegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <CoachShell active="competitions">
      <FormContainer variant="standard">
        <RegistrationFlow competitionId={id} />
      </FormContainer>
    </CoachShell>
  );
}
