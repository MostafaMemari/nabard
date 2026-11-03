"use client";

import { ErrorBanner, StateCard } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";

export function RegistrationFlowStates({ error, retry }: { error: unknown; retry: () => void }) {
  if (error) {
    return <ErrorBanner message="این مسابقه یافت نشد یا باز نیست." onRetry={retry} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <StateCard className="p-4">
        <Skeleton className="h-16 w-full" />
      </StateCard>
      <StateCard className="p-4">
        <Skeleton className="h-40 w-full" />
      </StateCard>
    </div>
  );
}
