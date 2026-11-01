"use client";

import { useState } from "react";
import { ConfirmDialog, DescriptionList, EmptyState, FormSection, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ReceiptLightbox } from "@/features/payments";
import { CompetitionsDemo } from "./competitions-demo";
import { ComponentShowcase } from "./component-showcase";
import { AdminShellDemo, CoachShellDemo } from "./shell-demos";

function ReceiptLightboxDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="نمایش بزرگ تصویر رسید"
        className="group relative block w-44 cursor-zoom-in overflow-hidden rounded-lg border border-border"
      >
        {/* biome-ignore lint/performance/noImgElement: static demo asset */}
        <img
          src="/receipts/receipt-sample.png"
          alt="نمونه تصویر رسید"
          className="h-auto w-full transition-transform duration-200 group-hover:scale-[1.03]"
        />
      </button>
      <ReceiptLightbox open={open} onOpenChange={setOpen} src="/receipts/receipt-sample.png" />
    </div>
  );
}

const detailItems = [
  { term: "عنوان", value: "مسابقات قهرمانی استان تهران" },
  { term: "رشته", value: "کیوروگی" },
  { term: "رده سنی", value: "بزرگسال" },
  { term: "مهلت ثبت نام", value: "۱۴۰۵/۰۹/۰۱" },
  { term: "هزینه هر هنرجو", value: "۳۵۰٬۰۰۰ تومان" },
];

export function DevUiContent() {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-10 p-4 md:p-8">
      <PageHeader title="اجزای مشترک" description="بررسی ظاهر اجزای پایه با داده آزمایشی" />

      <ComponentShowcase />

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">جدول داده</h2>
        <CompetitionsDemo />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
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

        <FormSection title="نمایش بزرگ رسید" description="کلیک روی تصویر، بزرگ نمایی با چرخ ماوس، کشیدن و دو بار کلیک">
          <ReceiptLightboxDemo />
        </FormSection>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">پوسته ادمین</h2>
        <p className="text-subtle text-muted-foreground">سایدبار تیره، نشان برند، آیتم فعال با نوار آبی و کارت کاربر</p>
        <div className="h-[620px] overflow-hidden rounded-2xl border border-border shadow-card">
          <AdminShellDemo />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">پوسته مربی</h2>
        <p className="text-subtle text-muted-foreground">نمایش موبایل با ناوبری پایین و نوار بالای صفحه</p>
        <div className="mx-auto h-[640px] w-full max-w-[390px] overflow-hidden rounded-2xl border border-border shadow-card">
          <CoachShellDemo />
        </div>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="حذف مسابقه"
        description="با حذف این مسابقه، ثبت نام های مرتبط هم حذف می شوند. این کار برگشت پذیر نیست."
        confirmLabel="حذف"
        destructive
        onConfirm={() => setConfirmOpen(false)}
      />
    </div>
  );
}
