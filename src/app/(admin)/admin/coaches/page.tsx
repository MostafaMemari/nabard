import { Suspense } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { CoachesScreen } from "@/features/users";
import { demoAdmin } from "@/lib/demo";

export default function AdminCoachesPage() {
  return (
    <AdminShell active="coaches" user={demoAdmin}>
      <Suspense fallback={null}>
        <CoachesScreen />
      </Suspense>
    </AdminShell>
  );
}
