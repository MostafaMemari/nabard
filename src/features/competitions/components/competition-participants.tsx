"use client";

import { PrinterIcon, UsersRoundIcon } from "lucide-react";
import { DownloadMenu, EmptyState, ErrorBanner } from "@/components/shared";
import { SkeletonRows } from "@/components/shared/rows-skeleton";
import { Button } from "@/components/ui/button";
import { useParticipants } from "@/features/registrations";
import { toPersianDigits } from "@/lib/format";
import { buildApiUrl } from "@/lib/http";
import { ParticipantsGroups } from "./participants-groups";

export function CompetitionParticipants({ competitionId }: { competitionId: string }) {
  const { participants, isLoading, error, mutate } = useParticipants(competitionId);
  const basePath = `/api/v1/competitions/${competitionId}/participants`;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-card md:p-6 print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">شرکت کنندگان تأیید شده</h2>
          <span className="text-subtle text-muted-foreground tabular-nums">({toPersianDigits(participants.length)} نفر)</span>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button variant="ghost" size="sm" onClick={() => window.print()}>
            <PrinterIcon data-icon="inline-start" />
            چاپ
          </Button>
          <DownloadMenu
            items={[
              { label: "فایل اکسل (xlsx)", href: buildApiUrl(`${basePath}.xlsx`) },
              { label: "فایل PDF", href: buildApiUrl(`${basePath}.pdf`) },
              { label: "فایل CSV", href: buildApiUrl(`${basePath}.csv`) },
            ]}
          />
        </div>
      </div>

      {error ? (
        <ErrorBanner message="دریافت فهرست شرکت کنندگان ناموفق بود." onRetry={() => mutate()} />
      ) : isLoading ? (
        <SkeletonRows rows={3} className="h-12" />
      ) : participants.length === 0 ? (
        <EmptyState icon={UsersRoundIcon} title="هنوز شرکت کننده تأیید شده ای برای این مسابقه وجود ندارد." tone="primary" />
      ) : (
        <ParticipantsGroups participants={participants} />
      )}
    </section>
  );
}
