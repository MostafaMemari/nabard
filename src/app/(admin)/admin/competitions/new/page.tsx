import { AdminShell } from "@/components/layout/admin-shell";
import { CompetitionFormScreen } from "@/features/competitions";
import { demoAdmin } from "@/lib/demo";

export default function AdminNewCompetitionPage() {
  return (
    <AdminShell active="competitions" user={demoAdmin}>
      <CompetitionFormScreen />
    </AdminShell>
  );
}
