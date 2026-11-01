"use client";

import { UsersIcon } from "lucide-react";
import { useState } from "react";
import { Avatar, DetailPageHeader, ErrorBanner, IconTile, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudents } from "@/features/students";
import { toPersianDigits } from "@/lib/format";
import { useCoach } from "../hooks/use-coaches";
import { CoachAccountSection } from "./coach-account-section";
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
    return <ErrorBanner message="مربی یافت نشد." onRetry={() => mutate()} />;
  }

  const coachStudents = students.filter((student) => student.coachId === coachId);

  return (
    <div className="flex flex-col gap-6">
      <DetailPageHeader
        backHref="/admin/coaches"
        backLabel="مربیان"
        title={coach.fullName}
        action={
          <Button
            variant={coach.isActive ? "outline" : "default"}
            className={coach.isActive ? "text-danger" : ""}
            onClick={() => setPendingStatus(!coach.isActive)}
          >
            {coach.isActive ? "غیرفعال کردن" : "فعال سازی"}
          </Button>
        }
      />

      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-card md:p-6">
        <Avatar id={coach.id} name={coach.fullName} size="lg" />
        <p className="text-subtle text-muted-foreground">مربی · {toPersianDigits(coach.mobile)}</p>
        <StatusBadge status={coach.isActive ? "ACTIVE" : "INACTIVE"} />
      </div>

      <CoachAccountSection coach={coach} studentCount={coachStudents.length} />

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <IconTile icon={UsersIcon} />
            <h2 className="text-base font-semibold">هنرجویان</h2>
          </div>
          <span className="text-subtle text-muted-foreground">{toPersianDigits(coachStudents.length)} هنرجو</span>
        </div>
        <CoachStudentsTable students={coachStudents} isLoading={studentsLoading} />
      </section>

      <CoachStatusDialog coach={coach} targetActive={pendingStatus} onDone={mutate} onClose={() => setPendingStatus(null)} />
    </div>
  );
}
