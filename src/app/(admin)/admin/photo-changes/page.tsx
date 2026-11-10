import { Suspense } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { ScreenSpinner } from "@/components/shared";
import { PhotoChangesScreen } from "@/features/photo-changes";

export default function PhotoChangesPage() {
  return (
    <AdminShell active="photo-changes">
      <Suspense fallback={<ScreenSpinner />}>
        <PhotoChangesScreen />
      </Suspense>
    </AdminShell>
  );
}
