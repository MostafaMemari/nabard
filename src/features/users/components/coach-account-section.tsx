"use client";
import { UserRoundIcon } from "lucide-react";

import { DescriptionList, FormSection } from "@/components/shared";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import type { User } from "../types";

export function CoachAccountSection({ coach, studentCount }: { coach: User; studentCount: number }) {
  return (
    <FormSection title="اطلاعات حساب" icon={UserRoundIcon}>
      <DescriptionList
        items={[
          { term: "شماره همراه", value: toPersianDigits(coach.mobile) },
          { term: "کد ملی", value: toPersianDigits(coach.nationalCode ?? "—") },
          { term: "تاریخ عضویت", value: formatJalaliDate(new Date(coach.createdAt)) },
          { term: "تعداد هنرجویان", value: `${toPersianDigits(studentCount)} هنرجو` },
        ]}
      />
    </FormSection>
  );
}
