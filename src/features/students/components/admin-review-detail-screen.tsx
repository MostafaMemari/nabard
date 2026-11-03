"use client";

import { useState } from "react";
import { DetailPageHeader, ErrorBanner, SkeletonRows, StateCard } from "@/components/shared";
import { useBelts } from "@/features/base-data";
import { useProfileReview } from "../hooks/use-profile-review";
import { useStudent } from "../hooks/use-student";
import { RejectProfileDialog } from "./reject-profile-dialog";
import { ReviewDocuments } from "./review-documents";
import { ReviewSideSummary } from "./review-side-summary";
import { StudentBeltEditor } from "./student-belt-editor";

export function AdminReviewDetailScreen({ studentId }: { studentId: string }) {
  const { student, isLoading, error, mutate } = useStudent(studentId);
  const { belts } = useBelts();
  const review = useProfileReview(mutate);
  const [rejectOpen, setRejectOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <SkeletonRows rows={1} className="h-8" />
        <StateCard className="p-4">
          <SkeletonRows rows={4} />
        </StateCard>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex flex-col gap-4">
        <DetailPageHeader backHref="/admin/profiles" backLabel="بررسی پروفایل ها" title="پروفایل هنرجو" />
        <ErrorBanner message="این هنرجو پیدا نشد یا به استان شما تعلق ندارد." onRetry={() => mutate()} />
      </div>
    );
  }

  const belt = belts.find((item) => item.id === student.beltId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <DetailPageHeader
        backHref="/admin/profiles"
        backLabel="بررسی پروفایل ها"
        title={student.fullName}
        description="مدارک هنرجو را بررسی و پروفایل را تأیید یا رد کنید."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">مدارک</h2>
          <ReviewDocuments studentId={student.id} documents={student.documents} />
        </section>
        <ReviewSideSummary
          student={student}
          belt={belt}
          working={review.working}
          onApprove={() => void review.approve(student.id)}
          onReject={() => setRejectOpen(true)}
        />
        <StudentBeltEditor key={student.id} student={student} belts={belts} onSaved={mutate} />
      </div>

      {rejectOpen ? (
        <RejectProfileDialog
          studentName={student.fullName}
          working={review.working}
          onReject={(note) => review.reject(student.id, note)}
          onClose={() => setRejectOpen(false)}
        />
      ) : null}
    </div>
  );
}
