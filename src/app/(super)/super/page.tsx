import { SuperShell } from "@/components/layout/super-shell";
import { SuperHomeScreen } from "@/features/super";

export default function SuperHomePage() {
  return (
    <SuperShell active="home">
      <SuperHomeScreen />
    </SuperShell>
  );
}
