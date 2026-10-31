import type { ReactNode } from "react";

export type DescriptionItem = {
  term: string;
  value: ReactNode;
};

export function DescriptionList({ items }: { items: DescriptionItem[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-[minmax(8rem,12rem)_1fr]">
      {items.map((item) => (
        <div key={item.term} className="contents">
          <dt className="text-[13px] text-muted-foreground">{item.term}</dt>
          <dd className="text-sm">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
