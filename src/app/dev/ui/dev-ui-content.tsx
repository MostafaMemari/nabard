"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog, DescriptionList, EmptyState, FormSection, PageHeader, StatusBadge, type StatusKey } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatJalaliDate, formatRialsAsToman } from "@/lib/format";
import { CompetitionsDemo } from "./competitions-demo";

const statuses: StatusKey[] = ["AWAITING_PAYMENT", "PENDING_REVIEW", "APPROVED", "REJECTED", "CANCELED", "DRAFT", "PUBLISHED"];

const detailItems = [
  { term: "عنوان", value: "مسابقات قهرمانی استان تهران" },
  { term: "رشته", value: "کیوروگی" },
  { term: "رده سنی", value: "بزرگسال" },
  { term: "مهلت ثبت نام", value: formatJalaliDate(new Date("2026-11-20T20:30:00.000Z")) },
  { term: "هزینه هر هنرجو", value: formatRialsAsToman(3500000) },
];

export function DevUiContent() {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-6">
      <PageHeader
        title="اجزای مشترک"
        description="بررسی ظاهر اجزای پایه با داده آزمایشی"
        action={
          <Button type="button">
            <PlusIcon aria-hidden />
            مسابقه جدید
          </Button>
        }
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-[15px] font-semibold">وضعیت ها</h2>
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[15px] font-semibold">جدول داده</h2>
        <CompetitionsDemo />
      </section>

      <FormSection title="فرم" description="نمونه یک بخش فرم با فیلد و متن راهنما">
        <Field>
          <FieldLabel htmlFor="demo-title">عنوان مسابقه</FieldLabel>
          <Input id="demo-title" placeholder="مثلا مسابقات قهرمانی استان" />
          <FieldDescription>حداکثر ۱۵۰ نویسه</FieldDescription>
        </Field>
        <div>
          <Button type="button">ذخیره</Button>
        </div>
      </FormSection>

      <FormSection title="جزئیات" description="فهرست کلید و مقدار">
        <DescriptionList items={detailItems} />
      </FormSection>

      <FormSection title="حالت خالی" description="یک جمله و یک اقدام">
        <EmptyState
          title="هنوز مسابقه ای ثبت نشده است."
          action={
            <Button type="button" size="sm">
              مسابقه جدید
            </Button>
          }
        />
      </FormSection>

      <FormSection title="دیالوگ تأیید" description="برای اقدام های مخرب">
        <div>
          <Button type="button" variant="destructive" onClick={() => setConfirmOpen(true)}>
            حذف مسابقه
          </Button>
        </div>
      </FormSection>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="حذف مسابقه"
        description="با حذف این مسابقه، ثبت نام های مرتبط هم حذف می شوند. این کار برگشت پذیر نیست."
        confirmLabel="حذف"
        destructive
        onConfirm={() => setConfirmOpen(false)}
      />
    </main>
  );
}
