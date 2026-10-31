"use client";

import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, BeltChip, ConfirmDialog, DescriptionList, FormSection, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBelts } from "@/features/base-data";
import { useStudents } from "@/features/students";
import { formatJalaliDate, formatNumber, toPersianDigits } from "@/lib/format";
import { updateCoachStatus } from "../api";
import { useCoach } from "../hooks/use-coaches";

export function CoachDetailScreen({ coachId }: { coachId: string }) {
  const { coach, isLoading, error, mutate } = useCoach(coachId);
  const { students, isLoading: studentsLoading } = useStudents();
  const { belts } = useBelts();
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);
  const [working, setWorking] = useState(false);

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

  async function runStatusUpdate() {
    if (pendingStatus === null) {
      return;
    }
    setWorking(true);
    try {
      await updateCoachStatus(coachId, pendingStatus);
      toast.success(pendingStatus ? "مربی فعال شد." : "مربی غیرفعال شد.");
      await mutate();
      setPendingStatus(null);
    } catch {
      toast.error("انجام نشد. دوباره تلاش کنید.");
    } finally {
      setWorking(false);
    }
  }

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

        {studentsLoading ? (
          <div className="flex flex-col gap-2">
            {["s1", "s2", "s3"].map((id) => (
              <Skeleton key={id} className="h-12 w-full" />
            ))}
          </div>
        ) : coachStudents.length === 0 ? (
          <p className="text-subtle text-muted-foreground">این مربی هنوز هنرجویی اضافه نکرده است.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>هنرجو</TableHead>
                  <TableHead>کمربند</TableHead>
                  <TableHead>وزن</TableHead>
                  <TableHead>تاریخ تولد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coachStudents.map((student) => {
                  const belt = belts.find((item) => item.id === student.beltId);
                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar id={student.id} name={student.fullName} size="sm" />
                          <span className="text-sm font-medium">{student.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{belt ? <BeltChip belt={belt} /> : "—"}</TableCell>
                      <TableCell className="text-subtle whitespace-nowrap text-muted-foreground">
                        {student.weightKg !== null ? `${formatNumber(student.weightKg)} کیلوگرم` : "—"}
                      </TableCell>
                      <TableCell className="text-subtle whitespace-nowrap text-muted-foreground">
                        {formatJalaliDate(new Date(student.birthDate))}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={pendingStatus !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingStatus(null);
          }
        }}
        title={pendingStatus ? "فعال‌سازی مربی" : "غیرفعال کردن مربی"}
        description={
          pendingStatus
            ? `با فعال‌سازی، «${coach.fullName}» می‌تواند دوباره وارد سامانه شود.`
            : `با غیرفعال کردن حساب، «${coach.fullName}» دیگر نمی‌تواند وارد سامانه شود. اطلاعات هنرجویان او حفظ می‌شود.`
        }
        confirmLabel={pendingStatus ? "فعال‌سازی" : "غیرفعال کردن"}
        destructive={pendingStatus === false}
        loading={working}
        onConfirm={() => void runStatusUpdate()}
      />
    </div>
  );
}
