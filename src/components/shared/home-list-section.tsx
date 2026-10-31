"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ErrorBanner } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";

export function HomeListSection({
  title,
  href,
  error,
  onRetry,
  isLoading,
  isEmpty,
  empty,
  children,
}: {
  title: string;
  href: string;
  error?: unknown;
  onRetry?: () => void;
  isLoading: boolean;
  isEmpty: boolean;
  empty: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <Link
          href={href}
          className="text-subtle min-h-11 py-2.5 font-medium text-primary underline-offset-4 hover:underline md:min-h-0 md:py-0"
        >
          مشاهده همه
        </Link>
      </div>
      {error ? (
        <ErrorBanner onRetry={onRetry} />
      ) : isLoading ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
          {["s1", "s2", "s3"].map((key) => (
            <Skeleton key={key} className="h-12 w-full" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="rounded-xl border border-border bg-card shadow-card">{empty}</div>
      ) : (
        children
      )}
    </section>
  );
}
