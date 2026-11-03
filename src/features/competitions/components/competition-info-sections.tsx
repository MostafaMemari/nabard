"use client";

import { BanknoteIcon, UsersRoundIcon } from "lucide-react";
import { DescriptionList, FormSection } from "@/components/shared";
import { type Belt, genderLabels } from "@/features/base-data";
import { formatCardNumber, formatJalaliDate, formatRialsAsToman, toPersianDigits } from "@/lib/format";
import { disciplineLabels } from "../labels";
import type { Competition } from "../types";
import { BeltChips } from "./belt-chips";
import { CountyChip } from "./county-chip";

export function CompetitionInfoSections({
  competition,
  belts,
  weightClassCount,
}: {
  competition: Competition;
  belts: Belt[];
  weightClassCount: number;
}) {
  const hasBelts = competition.beltIds.some((id) => belts.some((belt) => belt.id === id));

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2 print:hidden">
      <FormSection title="شرکت کنندگان" icon={UsersRoundIcon}>
        <DescriptionList
          items={[
            { term: "رشته", value: disciplineLabels[competition.discipline] },
            { term: "جنسیت", value: genderLabels[competition.gender] },
            { term: "رده سنی", value: competition.ageCategoryLabel },
            ...(competition.level === "COUNTY" && competition.countyNames.length > 0
              ? [
                  {
                    term: "شهرستان ها",
                    value: (
                      <span className="flex flex-wrap gap-1">
                        {competition.countyNames.map((name) => (
                          <CountyChip key={name} name={name} />
                        ))}
                      </span>
                    ),
                  },
                ]
              : []),
            { term: "رده های وزنی", value: `${toPersianDigits(weightClassCount)} رده` },
            ...(hasBelts ? [{ term: "کمربندها", value: <BeltChips belts={belts} ids={competition.beltIds} /> }] : []),
          ]}
        />
      </FormSection>

      <FormSection title="زمان و پرداخت" icon={BanknoteIcon}>
        <DescriptionList
          items={[
            { term: "مهلت ثبت نام", value: formatJalaliDate(new Date(competition.registrationDeadline)) },
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
