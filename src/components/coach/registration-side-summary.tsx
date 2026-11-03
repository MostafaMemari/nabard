"use client";

import { ReceiptTextIcon, TrophyIcon } from "lucide-react";
import Link from "next/link";
import { DescriptionList, SectionCard, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { paymentStatusKey } from "@/features/registrations";
import { formatJalaliDateTime, formatRialsAsToman, toPersianDigits } from "@/lib/format";
import type { useCoachRegistrationDetail } from "./use-coach-registration-detail";

type Detail = NonNullable<ReturnType<typeof useCoachRegistrationDetail>["detail"]>;

export function RegistrationSideSummary({ detail }: { detail: Detail }) {
  const { registration, competition, payment } = detail;

  return (
    <>
      <SectionCard title="اطلاعات ثبت نام" icon={ReceiptTextIcon}>
        <DescriptionList
          items={[
            { term: "رده وزنی", value: detail.weightClassLabel ? `${toPersianDigits(detail.weightClassLabel)} کیلوگرم` : "-" },
            { term: "تاریخ ثبت نام", value: formatJalaliDateTime(new Date(registration.createdAt)) },
            { term: "مبلغ", value: payment ? formatRialsAsToman(Number(payment.amount)) : "-" },
            { term: "وضعیت رسید", value: payment ? <StatusBadge status={paymentStatusKey(payment.status)} /> : "-" },
          ]}
        />
      </SectionCard>

      <SectionCard title="مسابقه" icon={TrophyIcon}>
        <p className="text-sm font-medium">{competition?.title ?? "-"}</p>
        <DescriptionList
          items={[
            {
              term: "مهلت ثبت نام",
              value: competition ? formatJalaliDateTime(new Date(competition.registrationDeadline)) : "-",
            },
          ]}
        />
        <Button size="sm" variant="outline" render={<Link href={`/coach/competitions/${registration.competitionId}`} />} className="w-fit">
          مشاهده مسابقه
        </Button>
      </SectionCard>
    </>
  );
}
