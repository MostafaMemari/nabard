"use client";

import { ArrowLeftRightIcon, FileQuestionIcon, ImageUpIcon, MapPinnedIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { SectionCard, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useMe } from "@/features/auth";
import { CoachPhotoChangeDialog, usePhotoChangeRequests } from "@/features/photo-changes";
import { ProvinceChangeRequestDialog, useProvinceChangeRequests } from "@/features/province-changes";
import { CoachChangeDialog, type CoachTransferRequest, useTransferRequests } from "@/features/transfers";
import type { StudentDetail } from "../types";

function pendingBadge(pending: boolean): ReactNode {
  return pending ? <StatusBadge status="PENDING_REVIEW" /> : null;
}

// The three change requests a coach can raise for their own student. Each one
// goes "under review" with the province admin; pending ones block a new
// request of the same kind.
export function StudentRequestActions({ student }: { student: StudentDetail }) {
  const { user } = useMe();
  const [dialog, setDialog] = useState<"photo" | "coach" | "province" | null>(null);

  const photoChanges = usePhotoChangeRequests();
  const provinceChanges = useProvinceChangeRequests();
  const transfers = useTransferRequests();

  const studentPhotoRequests = (photoChanges.result?.data ?? []).filter((request) => request.studentId === student.id);
  const studentProvinceRequests = (provinceChanges.result?.data ?? []).filter((request) => request.studentId === student.id);
  const studentTransferRequests = (transfers.result?.data ?? []).filter(
    (request): request is CoachTransferRequest => "direction" in request && request.studentId === student.id,
  );

  const photoPending = studentPhotoRequests.some((request) => request.status === "PENDING");
  const transferPending = studentTransferRequests.some((request) => request.status === "PENDING");
  const provincePending = studentProvinceRequests.some((request) => request.status === "PENDING");

  function refresh() {
    void photoChanges.mutate();
    void provinceChanges.mutate();
    void transfers.mutate();
  }

  return (
    <SectionCard title="درخواست های هنرجو" description="تغییر عکس، مربی و استان با تأیید ادمین استان انجام می شود.">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <ImageUpIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            تغییر عکس پروفایل
          </span>
          <span className="flex items-center gap-2">
            {pendingBadge(photoPending)}
            <Button size="sm" variant="outline" onClick={() => setDialog("photo")}>
              درخواست
            </Button>
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <ArrowLeftRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            تغییر مربی
          </span>
          <span className="flex items-center gap-2">
            {pendingBadge(transferPending)}
            <Button size="sm" variant="outline" onClick={() => setDialog("coach")}>
              درخواست
            </Button>
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <MapPinnedIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            تغییر استان
          </span>
          <span className="flex items-center gap-2">
            {pendingBadge(provincePending)}
            <Button size="sm" variant="outline" onClick={() => setDialog("province")}>
              درخواست
            </Button>
          </span>
        </div>
        {studentPhotoRequests.length === 0 && studentProvinceRequests.length === 0 && studentTransferRequests.length === 0 ? (
          <p className="flex items-center gap-2 text-subtle text-muted-foreground">
            <FileQuestionIcon aria-hidden className="size-4" />
            تاکنون درخواستی برای این هنرجو ثبت نشده است.
          </p>
        ) : null}
      </div>

      <CoachPhotoChangeDialog
        studentId={student.id}
        studentName={student.fullName}
        open={dialog === "photo"}
        hasPending={photoPending}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
          }
        }}
        onRequested={refresh}
      />
      <CoachChangeDialog
        studentId={student.id}
        studentName={student.fullName}
        open={dialog === "coach"}
        hasPending={transferPending}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
          }
        }}
        onRequested={refresh}
      />
      <ProvinceChangeRequestDialog
        studentId={student.id}
        studentName={student.fullName}
        currentProvince={user?.province ?? null}
        open={dialog === "province"}
        hasPending={provincePending || transferPending}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
          }
        }}
        onRequested={refresh}
      />
    </SectionCard>
  );
}
