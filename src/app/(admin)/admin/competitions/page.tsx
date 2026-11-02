import { Suspense } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { ScreenSpinner } from "@/components/shared";
import { CompetitionsScreen } from "@/features/competitions";

export default function AdminCompetitionsPage() {
  return (
    <AdminShell active="competitions">
      <Suspense fallback={<ScreenSpinner />}>
        <CompetitionsScreen />
      </Suspense>
    </AdminShell>
  );
}
