import { Suspense } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { ScreenSpinner } from "@/components/shared";
import { CountiesAdminScreen } from "@/features/counties";

export default function AdminCountiesPage() {
  return (
    <AdminShell active="counties">
      <Suspense fallback={<ScreenSpinner />}>
        <CountiesAdminScreen />
      </Suspense>
    </AdminShell>
  );
}
