import { AdminShell } from "@/components/layout/admin-shell";
import { CountyChangesScreen } from "@/features/county-changes";

export default function CountyChangesPage() {
  return (
    <AdminShell active="county-changes">
      <CountyChangesScreen />
    </AdminShell>
  );
}
