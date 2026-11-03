"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { DescriptionList } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { GenderChip, useCoach } from "@/features/users";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";

// Quick view behind a coach row in the county change table: the account facts
// the admin needs while reviewing, plus a link to the full profile page.
export function CountyChangeCoachDialog({ coachId, onClose }: { coachId: string | null; onClose: () => void }) {
  const { coach, isLoading, error, mutate } = useCoach(coachId ?? "");
  const open = coachId !== null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent showCloseButton className="max-w-md">
        <DialogHeader>
          <DialogTitle>اطلاعات مربی</DialogTitle>
          <DialogDescription>مشخصات حساب مربی و شهرستان فعلی او.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : error || !coach ? (
          <p className="text-subtle text-muted-foreground">اطلاعات مربی بارگذاری نشد.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <DescriptionList
              items={[
                { term: "شماره همراه", value: toPersianDigits(coach.mobile) },
                { term: "کد ملی", value: toPersianDigits(coach.nationalCode ?? "-") },
                { term: "جنسیت", value: <GenderChip gender={coach.gender} /> },
                { term: "شهرستان فعلی", value: coach.countyName ?? "نامشخص" },
                { term: "تاریخ عضویت", value: formatJalaliDate(new Date(coach.createdAt)) },
              ]}
            />
            <Button variant="outline" size="sm" className="self-start" render={<Link href={`/admin/coaches/${coach.id}`} />}>
              مشاهده پروفایل کامل
              <ArrowLeftIcon data-icon="inline-end" />
            </Button>
          </div>
        )}
        {error ? (
          <Button variant="ghost" size="sm" className="self-start" onClick={() => void mutate()}>
            تلاش دوباره
          </Button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
