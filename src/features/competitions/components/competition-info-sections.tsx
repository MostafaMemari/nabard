"use client";

import { BanknoteIcon, FileTextIcon, PencilIcon, UsersRoundIcon } from "lucide-react";
import { DescriptionList, SectionCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
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
  onEditDescription,
}: {
  competition: Competition;
  belts: Belt[];
  weightClassCount: number;
  onEditDescription?: () => void;
}) {
  const hasBelts = competition.beltIds.some((id) => belts.some((belt) => belt.id === id));
  const showDescriptionSection = Boolean(competition.description) || onEditDescription !== undefined;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2 print:hidden">
      {showDescriptionSection ? (
        <SectionCard
          title="توضیحات"
          description={competition.description ? undefined : "هنوز توضیحی نوشته نشده است"}
          icon={FileTextIcon}
          className="lg:col-span-2"
          action={
            onEditDescription ? (
              <Button type="button" variant="outline" size="sm" onClick={onEditDescription}>
                <PencilIcon data-icon="inline-start" />
                {competition.description ? "ویرایش توضیحات" : "افزودن توضیحات"}
              </Button>
            ) : null
          }
        >
          {competition.description ? (
            <p className="text-sm leading-7 whitespace-pre-line">{competition.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              می توانید نکته هایی برای مربی ها بنویسید؛ مثلاً آدرس سالن، برنامه روز مسابقه یا مدارک لازم. این بخش در هر زمان قابل ویرایش است
            </p>
          )}
        </SectionCard>
      ) : null}

      <SectionCard title="شرکت کنندگان" icon={UsersRoundIcon}>
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
      </SectionCard>

      <SectionCard title="زمان و پرداخت" icon={BanknoteIcon}>
        <DescriptionList
          items={[
            { term: "مهلت ثبت نام", value: formatJalaliDate(new Date(competition.registrationDeadline)) },
            { term: "تاریخ برگزاری", value: formatJalaliDate(new Date(competition.eventDate)) },
            { term: "هزینه هر هنرجو", value: formatRialsAsToman(Number(competition.feePerStudent)) },
            { term: "شماره کارت", value: formatCardNumber(competition.payeeCardNumber) },
            { term: "صاحب کارت", value: competition.payeeCardHolder },
          ]}
        />
      </SectionCard>
    </div>
  );
}
