"use client";

import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ErrorBanner, SkeletonRows } from "@/components/shared";

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
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <Link
          href={href}
          className="text-subtle flex min-h-11 items-center gap-0.5 py-2.5 font-medium text-primary underline-offset-4 hover:underline md:min-h-0 md:py-0"
        >
          مشاهده همه
          <ChevronLeftIcon aria-hidden className="size-3.5" />
        </Link>
      </div>
      {error ? (
        <ErrorBanner onRetry={onRetry} />
      ) : isLoading ? (
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <SkeletonRows rows={3} className="h-12" />
        </div>
      ) : isEmpty ? (
        <div className="rounded-xl border border-border bg-card shadow-card">{empty}</div>
      ) : (
        children
      )}
    </section>
  );
}
