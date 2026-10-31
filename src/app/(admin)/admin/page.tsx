import { AdminHomeScreen } from "@/components/admin/admin-home-screen";
import { AdminShell } from "@/components/layout/admin-shell";
import { demoAdmin } from "@/lib/demo";

export default function AdminHomePage() {
  return (
    <AdminShell active="home" user={demoAdmin}>
      <AdminHomeScreen />
    </AdminShell>
  );
}
