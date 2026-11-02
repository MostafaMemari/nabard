import { Suspense } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { ScreenSpinner } from "@/components/shared";
import { AdminReviewScreen } from "@/features/students";

export default function AdminProfilesPage() {
  return (
    <AdminShell active="profiles">
      <Suspense fallback={<ScreenSpinner />}>
        <AdminReviewScreen />
      </Suspense>
    </AdminShell>
  );
}
