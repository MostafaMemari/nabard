"use client";

import { ImageUpIcon } from "lucide-react";
import { EmptyState, ErrorBanner, SectionCard, SkeletonRows, StatusBadge } from "@/components/shared";
import { formatJalaliDate } from "@/lib/format";
import { photoChangeStatusKey } from "../labels";
import type { CoachPhotoChangeRequest } from "../types";

function RequestRow({ request }: { request: CoachPhotoChangeRequest }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">تغییر عکس «{request.studentName}»</p>
        <p className="text-subtle text-muted-foreground">
          {formatJalaliDate(new Date(request.createdAt))}
          {request.status !== "PENDING" && request.decidedAt ? ` — بررسی: ${formatJalaliDate(new Date(request.decidedAt))}` : ""}
        </p>
        {request.status === "REJECTED" && request.note ? <p className="text-subtle mt-1 text-danger">{request.note}</p> : null}
      </div>
      <StatusBadge status={photoChangeStatusKey(request.status)} />
    </div>
  );
}

// Status list of the coach's own photo change requests, shown on the coach
// students page next to the transfer section.
export function CoachPhotoChangesSection({
  requests,
  isLoading,
  error,
  onRetry,
}: {
  requests: CoachPhotoChangeRequest[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <SectionCard title="درخواست های تغییر عکس" description="عکس جدید هنرجو با تأیید ادمین استان جایگزین عکس پروفایل می شود">
      {isLoading ? (
        <SkeletonRows rows={2} />
      ) : error ? (
        <ErrorBanner message="دریافت درخواست های تغییر عکس انجام نشد" onRetry={onRetry} />
      ) : requests.length === 0 ? (
        <EmptyState icon={ImageUpIcon} title="درخواست تغییر عکسی ثبت نشده است" />
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
