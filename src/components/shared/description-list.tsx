import type { ReactNode } from "react";

export type DescriptionItem = {
  term: string;
  value: ReactNode;
};

export function DescriptionList({ items }: { items: DescriptionItem[] }) {
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-x-6 gap-y-2">
      {items.map((item) => (
        <div key={item.term} className="contents">
          <dt className="text-subtle text-muted-foreground">{item.term}</dt>
          <dd className="text-sm tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
