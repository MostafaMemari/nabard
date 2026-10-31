"use client";

import { EmptyState } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";

export function RegistrationFlowStates({ error, retry }: { error: unknown; retry: () => void }) {
  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-card">
        <EmptyState
          title="این مسابقه یافت نشد."
          action={
            <button type="button" onClick={retry} className="text-sm font-medium text-primary hover:underline">
              تلاش دوباره
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
