import { AdminShell } from "@/components/layout/admin-shell";
import { CountiesAdminScreen } from "@/features/counties";

export default function AdminCountiesPage() {
  return (
    <AdminShell active="counties">
      <CountiesAdminScreen />
    </AdminShell>
  );
}
