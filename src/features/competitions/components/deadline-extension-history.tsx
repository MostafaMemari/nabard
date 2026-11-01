"use client";

import { HistoryIcon } from "lucide-react";
import { ErrorBanner } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { formatJalaliDateTime, toPersianDigits } from "@/lib/format";
import { useDeadlineExtensions } from "../hooks/use-competitions";

export function DeadlineExtensionHistory({ competitionId, open }: { competitionId: string; open: boolean }) {
  const { extensions, isLoading, error, mutate } = useDeadlineExtensions(competitionId, open);

  if (!open) return null;

  return (
    <section className="flex flex-col gap-3 border-t border-border pt-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <HistoryIcon className="size-4 text-muted-foreground" />
        تاریخچه تمدید
      </h3>
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : error ? (
        <ErrorBanner message="دریافت تاریخچه تمدید انجام نشد." onRetry={() => mutate()} />
      ) : extensions.length === 0 ? (
        <p className="text-subtle text-muted-foreground">هنوز تمدیدی برای این مسابقه ثبت نشده است.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {extensions.map((extension) => (
            <li key={extension.id} className="rounded-xl border border-border bg-muted p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  مهلت: {formatJalaliDateTime(new Date(extension.previousDeadline))} ←{" "}
                  {formatJalaliDateTime(new Date(extension.newDeadline))}
                </span>
                {extension.reopenForRejected ? (
                  <span className="inline-flex h-6 items-center rounded-full bg-primary-subtle px-2.5 text-primary text-xs font-medium">
                    بازگشایی برای رد شده‌ها
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-subtle text-muted-foreground">{extension.reason}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                توسط {extension.createdByName} · {formatJalaliDateTime(new Date(extension.createdAt))}
              </p>
            </li>
          ))}
        </ol>
      )}
      <p className="text-xs text-muted-foreground">{toPersianDigits(extensions.length)} تمدید ثبت شده</p>
    </section>
  );
}
