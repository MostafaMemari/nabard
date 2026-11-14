"use client";

import { UserPlusIcon } from "lucide-react";
import { useState } from "react";
import { EmptyState, ErrorBanner, SectionCard, SkeletonRows, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { Belt } from "@/features/base-data";
import { formatJalaliDate } from "@/lib/format";
import type { RegistrationRequest } from "../types";
import { registrationStatusKey } from "../types";
import { RegistrationRequestEditDialog } from "./registration-request-edit-dialog";
import { RegistrationRequestPhotoDialog } from "./registration-request-photo-dialog";

function RequestRow({ request, belts, onChanged }: { request: RegistrationRequest; belts: Belt[]; onChanged: () => Promise<unknown> }) {
  const [editOpen, setEditOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const belt = belts.find((item) => item.id === request.beltId);

  return (
    <div className="flex flex-col gap-2 border-b border-border py-2.5 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">
            ثبت «{request.fullName}» — کد ملی <span className="tabular-nums">{request.nationalCode}</span>
            {belt ? ` — ${belt.label}` : ""}
          </p>
          <p className="text-subtle text-muted-foreground">
            {formatJalaliDate(new Date(request.createdAt))}
            {request.reviewedAt !== null ? ` — بررسی: ${formatJalaliDate(new Date(request.reviewedAt))}` : ""}
            {request.status !== "APPROVED" && request.photoUrl ? " — عکس بارگذاری شده" : ""}
          </p>
        </div>
        <StatusBadge status={registrationStatusKey(request.status)} />
      </div>

      {request.status === "REJECTED" && request.reviewNote ? (
        <p className="text-subtle rounded-lg bg-warning-bg px-2.5 py-1.5 text-warning">{request.reviewNote}</p>
      ) : null}

      {request.status !== "APPROVED" ? (
        <div className="flex flex-wrap items-center gap-2">
          {request.photoUrl ? null : (
            <span className="text-subtle rounded-lg bg-warning-bg px-2.5 py-1 text-warning">عکس پرسنلی بارگذاری نشده است</span>
          )}
          <Button size="sm" variant="outline" onClick={() => setPhotoOpen(true)}>
            {request.photoUrl ? "تغییر عکس" : "بارگذاری عکس"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            ویرایش و ارسال مجدد
          </Button>
        </div>
      ) : null}

      {editOpen ? (
        <RegistrationRequestEditDialog request={request} belts={belts} open={editOpen} onOpenChange={setEditOpen} onSaved={onChanged} />
      ) : null}
      {photoOpen ? (
        <RegistrationRequestPhotoDialog request={request} open={photoOpen} onOpenChange={setPhotoOpen} onUploaded={onChanged} />
      ) : null}
    </div>
  );
}

// The coach's own registration requests: pending review, approved as real
// students, or rejected and waiting for correction.
export function CoachRegistrationRequestsSection({
  requests,
  belts,
  isLoading,
  error,
  onRetry,
}: {
  requests: RegistrationRequest[];
  belts: Belt[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <SectionCard title="درخواست های ثبت هنرجو" description="با تأیید ادمین استان، درخواست به هنرجوی باشگاه تبدیل می شود">
      {isLoading ? (
        <SkeletonRows rows={2} />
      ) : error ? (
        <ErrorBanner message="دریافت درخواست های ثبت هنرجو انجام نشد" onRetry={onRetry} />
      ) : requests.length === 0 ? (
        <EmptyState icon={UserPlusIcon} title="درخواست ثبت هنرجویی ثبت نشده است" />
      ) : (
        <div>
          {requests.map((request) => (
            <RequestRow key={request.id} request={request} belts={belts} onChanged={async () => onRetry()} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
