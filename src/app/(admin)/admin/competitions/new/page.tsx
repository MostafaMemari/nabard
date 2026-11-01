import { AdminShell } from "@/components/layout/admin-shell";
import { CompetitionFormScreen } from "@/features/competitions";

export default function AdminNewCompetitionPage() {
  return (
    <AdminShell active="competitions">
      <CompetitionFormScreen />
    </AdminShell>
  );
}
