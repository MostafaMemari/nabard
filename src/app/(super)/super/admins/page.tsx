import { Suspense } from "react";
import { SuperShell } from "@/components/layout/super-shell";
import { AdminsScreen } from "@/features/admins";

export default function SuperAdminsPage() {
  return (
    <SuperShell active="admins">
      <Suspense fallback={null}>
        <AdminsScreen />
      </Suspense>
    </SuperShell>
  );
}
