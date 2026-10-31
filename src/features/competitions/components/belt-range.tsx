import { BeltChip } from "@/components/shared/belt-chip";
import type { Belt } from "@/features/base-data";

export function BeltRange({ from, to }: { from: Belt; to: Belt }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <BeltChip belt={from} />
      {from.id !== to.id ? (
        <>
          <span className="text-subtle text-muted-foreground">تا</span>
          <BeltChip belt={to} />
        </>
      ) : null}
    </div>
  );
}
