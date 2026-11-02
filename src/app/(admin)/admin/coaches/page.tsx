import { Suspense } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { ScreenSpinner } from "@/components/shared";
import { CoachesScreen } from "@/features/users";

export default function AdminCoachesPage() {
  return (
    <AdminShell active="coaches">
      <Suspense fallback={<ScreenSpinner />}>
        <CoachesScreen />
      </Suspense>
    </AdminShell>
  );
}
