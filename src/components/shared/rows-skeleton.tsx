"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonRows({ rows = 3, className = "h-12" }: { rows?: number; className?: string }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }, (_, index) => `row-${index}`).map((key) => (
        <Skeleton key={key} className={`${className} w-full`} />
      ))}
    </div>
  );
}
