"use client";

import { ArrowLeftRightIcon } from "lucide-react";
import { EmptyState, ErrorBanner, SectionCard, SkeletonRows, StatusBadge } from "@/components/shared";
import { formatJalaliDate } from "@/lib/format";
import { transferStatusKey, transferStatusLabels } from "../labels";
import type { CoachTransferRequest } from "../types";

function RequestRow({ request }: { request: CoachTransferRequest }) {
  const outgoing = request.direction === "outgoing";

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        {outgoing ? (
          <p className="truncate text-sm">
            {request.studentName ? (
              <>
                انتقال «{request.studentName}» به مربی «{request.toCoachName}»
              </>
            ) : (
              <>انتقال به مربی «{request.toCoachName}»</>
            )}
          </p>
        ) : (
          <p className="truncate text-sm">
            {request.studentName}
            <span className="text-subtle text-muted-foreground"> از مربی «{request.fromCoachName}»</span>
          </p>
        )}
        {request.createdAt ? <p className="text-subtle text-muted-foreground">{formatJalaliDate(new Date(request.createdAt))}</p> : null}
      </div>
      <StatusBadge status={transferStatusKey(request.status)} />
    </div>
  );
}

export function CoachTransfersSection({
  requests,
  isLoading,
  error,
  onRetry,
}: {
  requests: CoachTransferRequest[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <SectionCard
      title="درخواست های انتقال هنرجو"
      description="درخواست هایی که ثبت کرده اید یا هنرجویانی که درخواست انتقال آنها از باشگاه شما ثبت شده است."
    >
      {isLoading ? (
        <SkeletonRows rows={2} />
      ) : error ? (
        <ErrorBanner message="دریافت درخواست های انتقال انجام نشد." onRetry={onRetry} />
      ) : requests.length === 0 ? (
        <EmptyState icon={ArrowLeftRightIcon} title="درخواست انتقالی ثبت نشده است." />
      ) : (
        <div>
          {requests.map((request) => (
            <RequestRow key={request.id} request={request} />
          ))}
        </div>
      )}
      {requests.length > 0 ? (
        <p className="text-subtle text-muted-foreground">{transferStatusLabels.PENDING} به معنای بررسی نشدن توسط مدیر استان است.</p>
      ) : null}
    </SectionCard>
  );
}
