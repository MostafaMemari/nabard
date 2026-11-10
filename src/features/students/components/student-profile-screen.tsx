"use client";

import { DetailPageHeader, ErrorBanner, SkeletonRows } from "@/components/shared";
import { useBelts } from "@/features/base-data";
import { useStudent } from "../hooks/use-student";
import { StudentFieldTiles } from "./student-field-tiles";
import { StudentProfileHeader } from "./student-profile-header";
import { StudentRegistrationHistory } from "./student-registration-history";
import { StudentRequestActions } from "./student-request-actions";

export function StudentProfileScreen({ studentId }: { studentId: string }) {
  const { student, isLoading, error, mutate } = useStudent(studentId);
  const { belts } = useBelts();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <SkeletonRows rows={1} className="h-8" />
        <SkeletonRows rows={4} />
        <SkeletonRows rows={3} />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex flex-col gap-4">
        <DetailPageHeader backHref="/coach/students" backLabel="هنرجویان" title="پروفایل هنرجو" />
        <ErrorBanner message="این هنرجو پیدا نشد یا به فهرست شما تعلق ندارد." onRetry={() => mutate()} />
      </div>
    );
  }

  const belt = belts.find((item) => item.id === student.beltId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <DetailPageHeader backHref="/coach/students" backLabel="هنرجویان" title="پروفایل هنرجو" />
      <StudentProfileHeader student={student} />
      <StudentFieldTiles student={student} beltLabel={belt?.label ?? null} beltCode={belt?.code ?? null} />
      <StudentRequestActions student={student} />
      <StudentRegistrationHistory studentId={student.id} />
    </div>
  );
}
