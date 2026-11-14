"use client";

import { useState } from "react";
import { DetailPageHeader, ErrorBanner, SkeletonRows, StateCard } from "@/components/shared";
import { useBelts } from "@/features/base-data";
import { updateRegistrationRequestBelt } from "../api";
import { useProfileReview } from "../hooks/use-profile-review";
import { useRegistrationRequest } from "../hooks/use-registration-request";
import { RejectProfileDialog } from "./reject-profile-dialog";
import { RequestPhotoCard } from "./request-photo-card";
import { ReviewSideSummary } from "./review-side-summary";
import { StudentBeltEditor } from "./student-belt-editor";

// Province admin review of a student registration request: the coach's data,
// the personal photo and the requested belt. Approving creates the student.
export function AdminReviewDetailScreen({ requestId }: { requestId: string }) {
  const { request, isLoading, error, mutate } = useRegistrationRequest(requestId);
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

  if (error || !request) {
    return (
      <div className="flex flex-col gap-4">
        <DetailPageHeader backHref="/admin/profiles" backLabel="بررسی پروفایل ها" title="درخواست ثبت هنرجو" />
        <ErrorBanner message="این درخواست پیدا نشد یا به استان شما تعلق ندارد" onRetry={() => mutate()} />
      </div>
    );
  }

  const belt = belts.find((item) => item.id === request.beltId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <DetailPageHeader
        backHref="/admin/profiles"
        backLabel="بررسی پروفایل ها"
        title={request.fullName}
        description="اطلاعات و عکس درخواست ثبت هنرجو را بررسی و آن را تأیید یا رد کنید"
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">مدارک</h2>
          <RequestPhotoCard photoUrl={request.photoUrl ?? null} />
        </section>
        <ReviewSideSummary
          request={request}
          belt={belt}
          working={review.working}
          onApprove={() => void review.approve(request.id)}
          onReject={() => setRejectOpen(true)}
        />
        <StudentBeltEditor
          key={request.id}
          initialBeltId={request.beltId}
          belts={belts}
          disabled={request.status !== "PENDING"}
          onSave={(beltId) => updateRegistrationRequestBelt(request.id, beltId).then(() => mutate())}
        />
      </div>

      {rejectOpen ? (
        <RejectProfileDialog
          studentName={request.fullName}
          working={review.working}
          onReject={(note) => review.reject(request.id, note)}
          onClose={() => setRejectOpen(false)}
        />
      ) : null}
    </div>
  );
}
