import { SuperShell } from "@/components/layout/super-shell";
import { BaseDataAdminScreen } from "@/features/base-data";

export default function SuperBaseDataPage() {
  return (
    <SuperShell active="base-data">
      <BaseDataAdminScreen />
    </SuperShell>
  );
}
