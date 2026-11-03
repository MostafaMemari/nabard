"use client";

import { ClipboardListIcon, UsersIcon } from "lucide-react";
import { DetailPageHeader, ErrorBanner, SectionCard, SkeletonRows, StatusBadge } from "@/components/shared";
import { RegistrationTimeline, registrationStatusKey } from "@/features/registrations";
import { RegistrationBundleList } from "./registration-bundle-list";
import { RegistrationSideSummary } from "./registration-side-summary";
import { useCoachRegistrationDetail } from "./use-coach-registration-detail";

export function CoachRegistrationDetailScreen({ registrationId }: { registrationId: string }) {
  const { detail, isLoading, error, retry } = useCoachRegistrationDetail({ registrationId });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <SkeletonRows rows={1} className="h-8" />
        <SkeletonRows rows={4} />
        <SkeletonRows rows={3} />
      </div>
    );
  }

  if (error || !detail) {
    return <ErrorBanner message="ثبت نامی با این شماره پیدا نشد." onRetry={() => void retry()} />;
  }

  const { registration, competition, payment, bundle } = detail;

  return (
    <div className="flex flex-col gap-6">
      <DetailPageHeader
        backHref="/coach/registrations"
        backLabel="ثبت نام های من"
        title={registration.student.fullName}
        description={competition?.title ?? "-"}
        action={<StatusBadge status={registrationStatusKey(registration.status)} />}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <SectionCard title="وضعیت ثبت نام" icon={ClipboardListIcon}>
            <RegistrationTimeline registration={registration} paymentStatus={payment?.status ?? null} />
          </SectionCard>

          <SectionCard
            title="هنرجوهای این رسید"
            icon={UsersIcon}
            action={<span className="text-subtle text-muted-foreground">پرداخت مشترک</span>}
          >
            <RegistrationBundleList bundle={bundle} />
          </SectionCard>
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-8">
          <RegistrationSideSummary detail={detail} />
        </aside>
      </div>
    </div>
  );
}
