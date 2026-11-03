import type { ReactNode } from "react";
import { formatNumber } from "@/lib/format";

export function SelectionGroup({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">
        {title} <span className="font-normal text-muted-foreground">({formatNumber(count)})</span>
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
