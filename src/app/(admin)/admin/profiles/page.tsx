import { Suspense } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminReviewScreen } from "@/features/students";

export default function AdminProfilesPage() {
  return (
    <AdminShell active="profiles">
      <Suspense fallback={null}>
        <AdminReviewScreen />
      </Suspense>
    </AdminShell>
  );
}
