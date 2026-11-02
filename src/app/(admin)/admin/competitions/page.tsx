import { Suspense } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { CompetitionsScreen } from "@/features/competitions";
import { demoAdmin } from "@/lib/demo";

export default function AdminCompetitionsPage() {
  return (
    <AdminShell active="competitions" user={demoAdmin}>
      <Suspense fallback={null}>
        <CompetitionsScreen />
      </Suspense>
    </AdminShell>
  );
}
