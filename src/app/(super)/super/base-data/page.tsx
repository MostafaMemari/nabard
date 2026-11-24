import { SuperShell } from "@/components/layout/super-shell";
import { BaseDataScreen } from "@/features/base-data";

export default function SuperBaseDataPage() {
  return (
    <SuperShell active="base-data">
      <BaseDataScreen />
    </SuperShell>
  );
}
