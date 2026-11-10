"use client";

import { MapPinnedIcon } from "lucide-react";
import { EmptyState, ErrorBanner, SectionCard, SkeletonRows, StatusBadge } from "@/components/shared";
import { formatJalaliDate } from "@/lib/format";
import { provinceLabels } from "@/lib/provinces";
import { provinceChangeStatusKey } from "../labels";
import type { ProvinceChangeRequest } from "../types";

function RequestRow({ request }: { request: ProvinceChangeRequest }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">
          «{request.studentName}» به استان {provinceLabels[request.toProvince]}
          <span className="text-subtle text-muted-foreground"> — مربی: {request.toCoachName}</span>
        </p>
        <p className="text-subtle text-muted-foreground">
          {formatJalaliDate(new Date(request.createdAt))}
          {request.status !== "PENDING" && request.decidedAt ? ` — بررسی: ${formatJalaliDate(new Date(request.decidedAt))}` : ""}
        </p>
        {request.status === "REJECTED" && request.note ? <p className="text-subtle mt-1 text-danger">{request.note}</p> : null}
      </div>
      <StatusBadge status={provinceChangeStatusKey(request.status)} />
    </div>
  );
}

// Status list of the coach's own province change requests.
export function CoachProvinceChangesSection({
  requests,
  isLoading,
  error,
  onRetry,
}: {
  requests: ProvinceChangeRequest[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <SectionCard title="درخواست های تغییر استان" description="انتقال هنرجو به مربی استان دیگر با تأیید ادمین استان مقصد انجام می شود.">
      {isLoading ? (
        <SkeletonRows rows={2} />
      ) : error ? (
        <ErrorBanner message="دریافت درخواست های تغییر استان انجام نشد." onRetry={onRetry} />
      ) : requests.length === 0 ? (
        <EmptyState icon={MapPinnedIcon} title="درخواست تغییر استان ثبت نشده است." />
      ) : (
        <div>
          {requests.map((request) => (
            <RequestRow key={request.id} request={request} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
