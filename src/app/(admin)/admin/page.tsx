import { AdminHomeScreen } from "@/components/admin/admin-home-screen";
import { AdminShell } from "@/components/layout/admin-shell";

export default function AdminHomePage() {
  return (
    <AdminShell active="home">
      <AdminHomeScreen />
    </AdminShell>
  );
}
