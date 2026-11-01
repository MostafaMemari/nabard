import { SuperShell } from "@/components/layout/super-shell";
import { CountiesAdminScreen } from "@/features/counties";

export default function SuperCountiesPage() {
  return (
    <SuperShell active="counties">
      <CountiesAdminScreen />
    </SuperShell>
  );
}
