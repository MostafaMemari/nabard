import { Suspense } from "react";
import { SuperShell } from "@/components/layout/super-shell";
import { ScreenSpinner } from "@/components/shared";
import { AdminsScreen } from "@/features/admins";

export default function SuperAdminsPage() {
  return (
    <SuperShell active="admins">
      <Suspense fallback={<ScreenSpinner />}>
        <AdminsScreen />
      </Suspense>
    </SuperShell>
  );
}
