"use client";

import { useState } from "react";
import { Avatar, BeltChip, ConfirmDialog, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBelts } from "@/features/base-data";
import type { Registration } from "@/features/registrations";
import type { Student } from "@/features/students";
import { formatNumber, toPersianDigits } from "@/lib/format";

export function PaymentStudentsTable({
  registrations,
  students,
  isLoading,
  canApprove,
  busyId,
  onApprove,
  onReject,
}: {
  registrations: Registration[];
  students: Student[];
  isLoading: boolean;
  canApprove: boolean;
  busyId: string | null;
  onApprove: (registration: Registration) => Promise<void>;
  onReject: (registration: Registration) => Promise<void>;
}) {
  const { belts } = useBelts();
  const [pendingReject, setPendingReject] = useState<Registration | null>(null);

  function studentName(studentId: string): string {
    return students.find((student) => student.id === studentId)?.fullName ?? studentId;
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">هنرجویان ثبت‌نام‌شده</h2>
        <span className="text-subtle text-muted-foreground">{toPersianDigits(registrations.length)} هنرجو</span>
      </div>

      {!canApprove ? (
        <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          تأیید ثبت‌نام‌ها پس از تأیید رسید فعال می‌شود؛ رد کردن هر ثبت‌نام همیشه امکان‌پذیر است.
        </p>
      ) : null}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {["r1", "r2", "r3"].map((id) => (
            <Skeleton key={id} className="h-12 w-full" />
          ))}
        </div>
      ) : registrations.length === 0 ? (
        <p className="text-subtle text-muted-foreground">برای این رسید ثبت‌نامی وجود ندارد.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>هنرجو</TableHead>
                <TableHead>کمربند</TableHead>
                <TableHead>وزن</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead className="text-end">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((registration) => {
                const student = students.find((item) => item.id === registration.studentId);
                const belt = belts.find((item) => item.id === student?.beltId);
                const busy = busyId === registration.id;
                return (
                  <TableRow key={registration.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar id={registration.studentId} name={studentName(registration.studentId)} size="sm" />
                        <span className="text-sm font-medium">{studentName(registration.studentId)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{belt ? <BeltChip belt={belt} /> : "—"}</TableCell>
                    <TableCell className="text-subtle whitespace-nowrap text-muted-foreground">
                      {student?.weightKg != null ? `${formatNumber(student.weightKg)} کیلوگرم` : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={
                          registration.status === "PENDING"
                            ? "PENDING_REVIEW"
                            : registration.status === "APPROVED"
                              ? "APPROVED"
                              : "REJECTED"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canApprove || registration.status === "APPROVED" || busy}
                          onClick={() => void onApprove(registration)}
                        >
                          تأیید
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-danger"
                          disabled={registration.status === "REJECTED" || busy}
                          onClick={() => setPendingReject(registration)}
                        >
                          رد
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={pendingReject !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingReject(null);
          }
        }}
        title="رد ثبت‌نام"
        description={`ثبت‌نام «${pendingReject ? studentName(pendingReject.studentId) : ""}» رد می‌شود و هنرجو در این مسابقه پذیرفته نخواهد شد.`}
        confirmLabel="رد ثبت‌نام"
        destructive
        loading={busyId !== null}
        onConfirm={() => {
          if (pendingReject) {
            void onReject(pendingReject).finally(() => setPendingReject(null));
          }
        }}
      />
    </section>
  );
}
