"use client";

import { MapPinIcon } from "lucide-react";

export function CountyChip({ name }: { name: string }) {
  return (
    <span className="inline-flex h-6 w-fit items-center gap-1 rounded-full bg-pending-bg px-2.5 text-subtle font-medium text-pending">
      <MapPinIcon aria-hidden className="size-3" strokeWidth={1.75} />
      شهرستان {name}
    </span>
  );
}
