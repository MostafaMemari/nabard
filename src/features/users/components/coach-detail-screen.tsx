"use client";

import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar, DescriptionList, FormSection, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudents } from "@/features/students";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import { useCoach } from "../hooks/use-coaches";
import { CoachStatusDialog } from "./coach-status-dialog";
import { CoachStudentsTable } from "./coach-students-table";

export function CoachDetailScreen({ coachId }: { coachId: string }) {
  const { coach, isLoading, error, mutate } = useCoach(coachId);
  const { students, isLoading: studentsLoading } = useStudents();
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !coach) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
        مربی یافت نشد.
        <Button type="button" variant="ghost" size="sm" className="ms-2" onClick={() => mutate()}>
          تلاش دوباره
        </Button>
      </div>
    );
  }

  const coachStudents = students.filter((student) => student.coachId === coachId);

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ms-2 w-fit text-muted-foreground"
        render={
          <Link href="/admin/coaches">
            <ArrowRightIcon data-icon="inline-start" />
            مربیان
          </Link>
        }
      />

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex items-center gap-4">
          <Avatar id={coach.id} name={coach.fullName} size="lg" />
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold leading-tight">{coach.fullName}</h1>
            <p className="text-subtle text-muted-foreground">مربی · {toPersianDigits(coach.mobile)}</p>
          </div>
          <StatusBadge status={coach.isActive ? "ACTIVE" : "INACTIVE"} />
        </div>
        <Button
          variant={coach.isActive ? "outline" : "default"}
          className={coach.isActive ? "text-danger" : ""}
          onClick={() => setPendingStatus(!coach.isActive)}
        >
          {coach.isActive ? "غیرفعال کردن" : "فعال‌سازی"}
        </Button>
      </div>

      <FormSection title="اطلاعات حساب">
        <DescriptionList
          items={[
            { term: "شماره همراه", value: toPersianDigits(coach.mobile) },
            { term: "کد ملی", value: toPersianDigits(coach.nationalCode ?? "—") },
            { term: "تاریخ عضویت", value: formatJalaliDate(new Date(coach.createdAt)) },
            { term: "تعداد هنرجویان", value: `${toPersianDigits(coachStudents.length)} هنرجو` },
          ]}
        />
      </FormSection>

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">هنرجویان</h2>
          <span className="text-subtle text-muted-foreground">{toPersianDigits(coachStudents.length)} هنرجو</span>
        </div>
        <CoachStudentsTable students={coachStudents} isLoading={studentsLoading} />
      </section>

      <CoachStatusDialog coach={coach} targetActive={pendingStatus} onDone={mutate} onClose={() => setPendingStatus(null)} />
    </div>
  );
}
