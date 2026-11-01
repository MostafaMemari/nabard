import { Suspense } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { CoachesScreen } from "@/features/users";

export default function AdminCoachesPage() {
  return (
    <AdminShell active="coaches">
      <Suspense fallback={null}>
        <CoachesScreen />
      </Suspense>
    </AdminShell>
  );
}
