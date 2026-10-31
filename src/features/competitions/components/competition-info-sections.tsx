"use client";

import { DescriptionList, FormSection } from "@/components/shared";
import { ageCategoryLabel, type Belt, genderLabels } from "@/features/base-data";
import { formatCardNumber, formatJalaliDate, formatRialsAsToman, toPersianDigits } from "@/lib/format";
import { disciplineLabels } from "../labels";
import type { Competition } from "../types";
import { BeltChips } from "./belt-chips";

export function CompetitionInfoSections({
  competition,
  belts,
  weightClassCount,
}: {
  competition: Competition;
  belts: Belt[];
  weightClassCount: number;
}) {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <FormSection title="شرکت‌کنندگان">
        <DescriptionList
          items={[
            { term: "رشته", value: disciplineLabels[competition.discipline] },
            { term: "جنسیت", value: genderLabels[competition.gender] },
            { term: "رده سنی", value: ageCategoryLabel(competition.ageCategoryId) },
            { term: "رده‌های وزنی", value: `${toPersianDigits(weightClassCount)} رده` },
            { term: "کمربندها", value: <BeltChips belts={belts} ids={competition.beltIds} /> },
          ]}
        />
      </FormSection>

      <FormSection title="زمان و پرداخت">
        <DescriptionList
          items={[
            { term: "مهلت ثبت‌نام", value: formatJalaliDate(new Date(competition.registrationDeadline)) },
            { term: "تاریخ برگزاری", value: formatJalaliDate(new Date(competition.eventDate)) },
            { term: "هزینه هر هنرجو", value: formatRialsAsToman(Number(competition.feePerStudent)) },
            { term: "شماره کارت", value: formatCardNumber(competition.payeeCardNumber) },
            { term: "صاحب کارت", value: competition.payeeCardHolder },
          ]}
        />
      </FormSection>
    </div>
  );
}
