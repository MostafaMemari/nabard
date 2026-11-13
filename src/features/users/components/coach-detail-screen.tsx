"use client";

import { FileSpreadsheetIcon, UsersIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, DetailPageHeader, ErrorBanner, SectionCard, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentImportDialog, useStudents } from "@/features/students";
import { CoachReassignDialog } from "@/features/transfers";
import { toPersianDigits } from "@/lib/format";
import { useCoach, useCoaches } from "../hooks/use-coaches";
import { CoachAccountSection } from "./coach-account-section";
import { CoachEditDialog } from "./coach-edit-dialog";
import { CoachResetPasswordDialog } from "./coach-reset-password-dialog";
import { CoachStatusDialog } from "./coach-status-dialog";
import { CoachStudentsTable } from "./coach-students-table";

export function CoachDetailScreen({ coachId }: { coachId: string }) {
  const router = useRouter();
  const { coach, isLoading, error, mutate } = useCoach(coachId);
  const { students, isLoading: studentsLoading, mutate: reloadStudents } = useStudents();
  const { coaches } = useCoaches();
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

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
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <FileSpreadsheetIcon data-icon="inline-start" />
              ورود گروهی با اکسل
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              ویرایش
            </Button>
            <Button variant="outline" onClick={() => setResetOpen(true)}>
              بازنشانی رمز
            </Button>
            <Button variant="outline" onClick={() => setReassignOpen(true)}>
              انتقال هنرجویان
            </Button>
            <Button
              variant={coach.isActive ? "outline" : "default"}
              className={coach.isActive ? "text-danger" : ""}
              onClick={() => setPendingStatus(!coach.isActive)}
            >
              {coach.isActive ? "غیرفعال کردن" : "فعال سازی"}
            </Button>
          </div>
        }
      />

      <SectionCard>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar id={coach.id} name={coach.fullName} size="lg" />
          <p className="text-subtle text-muted-foreground">
            مربی · {toPersianDigits(coach.mobile)} · شهرستان {coach.countyName ?? "نامشخص"}
          </p>
          <StatusBadge status={coach.isActive ? "ACTIVE" : "INACTIVE"} />
        </div>
      </SectionCard>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <SectionCard
          title="هنرجویان"
          icon={UsersIcon}
          action={<span className="text-subtle text-muted-foreground">{toPersianDigits(coachStudents.length)} هنرجو</span>}
        >
          <CoachStudentsTable
            students={coachStudents}
            isLoading={studentsLoading}
            onOpen={(student) => router.push(`/admin/profiles/${student.id}`)}
          />
        </SectionCard>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-8">
          <CoachAccountSection coach={coach} studentCount={coachStudents.length} />
        </aside>
      </div>

      <CoachStatusDialog coach={coach} targetActive={pendingStatus} onDone={mutate} onClose={() => setPendingStatus(null)} />
      <StudentImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        coachId={coach.id}
        onImported={() => {
          void mutate();
          void reloadStudents();
        }}
      />
      <CoachEditDialog coach={editOpen ? coach : null} onOpenChange={setEditOpen} onSaved={() => void mutate()} />
      <CoachResetPasswordDialog coach={resetOpen ? coach : null} onDone={mutate} onClose={() => setResetOpen(false)} />
      <CoachReassignDialog
        coachId={coach.id}
        coachName={coach.fullName}
        targets={coaches.filter(
          (target) => target.id !== coach.id && target.isActive && target.gender !== null && target.gender === coach.gender,
        )}
        studentCount={coachStudents.length}
        open={reassignOpen}
        onOpenChange={setReassignOpen}
        onDone={() => {
          void mutate();
          void reloadStudents();
        }}
      />
    </div>
  );
}
