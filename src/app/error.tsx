"use client";

import { AlertTriangleIcon } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-center shadow-card">
        <span className="flex size-12 items-center justify-center rounded-full bg-danger-bg text-danger">
          <AlertTriangleIcon aria-hidden className="size-6" />
        </span>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-lg font-semibold">خطایی غیرمنتظره رخ داد</h1>
          <p className="text-sm text-muted-foreground">مشکلی در نمایش این بخش پیش آمد. دوباره تلاش کنید.</p>
        </div>
        <Button type="button" onClick={reset}>
          تلاش دوباره
        </Button>
      </div>
    </main>
  );
}
