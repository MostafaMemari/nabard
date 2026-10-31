"use client";

import { Button } from "@/components/ui/button";

export function ErrorBanner({ message = "دریافت اطلاعات ناموفق بود.", onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
      <span>{message}</span>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          تلاش دوباره
        </Button>
      ) : null}
    </div>
  );
}
