"use client";

import { BeltChip, DescriptionList, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { Belt } from "@/features/base-data";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import type { RegistrationRequestDetail } from "../types";
import { registrationStatusKey } from "../types";

export function ReviewSideSummary({
  request,
  belt,
  working,
  onApprove,
  onReject,
}: {
  request: RegistrationRequestDetail;
  belt: Belt | null;
  working: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="text-base font-semibold">درخواست ثبت هنرجو</span>
        <StatusBadge status={registrationStatusKey(request.status)} />
      </div>

      {request.status === "REJECTED" && request.reviewNote ? (
        <p className="rounded-lg bg-warning-bg px-3 py-2 text-subtle text-warning">{request.reviewNote}</p>
      ) : null}

      <DescriptionList
        items={[
          { term: "مربی", value: request.coachName },
          { term: "کد ملی", value: <span className="tabular-nums">{request.nationalCode}</span> },
          {
            term: "تلفن همراه",
            value:
              request.mobile !== null ? (
                <span dir="ltr" className="tabular-nums">
                  {request.mobile}
                </span>
              ) : (
                "ثبت نشده"
              ),
          },
          { term: "تاریخ تولد", value: formatJalaliDate(new Date(request.birthDate)) },
          {
            term: "تاریخ حکم کمربند",
            value: request.beltCertificateDate !== null ? formatJalaliDate(new Date(request.beltCertificateDate)) : "ثبت نشده",
          },
          {
            term: "تاریخ بیمه ورزشی",
            value: request.insuranceDate !== null ? formatJalaliDate(new Date(request.insuranceDate)) : "ثبت نشده",
          },
          {
            term: "سال شارژ بانک اطلاعات تکواندو",
            value: request.tkdBankChargeYear !== null ? toPersianDigits(request.tkdBankChargeYear) : "ثبت نشده",
          },
          { term: "کمربند", value: belt ? <BeltChip belt={belt} /> : "نامشخص" },
          { term: "تاریخ ثبت", value: formatJalaliDate(new Date(request.createdAt)) },
        ]}
      />

      {request.status === "PENDING" ? (
        <div className="flex flex-col gap-2">
          <Button onClick={onApprove} disabled={working}>
            تأیید و افزودن هنرجو
          </Button>
          <Button variant="outline" className="text-danger" onClick={onReject} disabled={working}>
            رد درخواست
          </Button>
        </div>
      ) : request.status === "REJECTED" ? (
        <p className="text-subtle text-muted-foreground">
          این درخواست رد شده است؛ پس از اینکه مربی اطلاعات را اصلاح و دوباره ارسال کرد، برای بررسی می آید
        </p>
      ) : (
        <p className="text-subtle text-muted-foreground">
          {request.reviewedAt ? `در تاریخ ${formatJalaliDate(new Date(request.reviewedAt))} تأیید شد و هنرجو اضافه شد` : "تأیید شده است"}
        </p>
      )}
    </div>
  );
}
