import { Suspense } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { CompetitionsScreen } from "@/features/competitions";

export default function AdminCompetitionsPage() {
  return (
    <AdminShell active="competitions">
      <Suspense fallback={null}>
        <CompetitionsScreen />
      </Suspense>
    </AdminShell>
  );
}
