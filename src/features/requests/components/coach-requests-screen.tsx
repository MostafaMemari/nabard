"use client";

import { useState } from "react";
import { FilterTabs, ListToolbar, PageHeader } from "@/components/shared";
import { useBelts } from "@/features/base-data";
import { CoachPhotoChangesSection, usePhotoChangeRequests } from "@/features/photo-changes";
import { CoachProvinceChangesSection, useProvinceChangeRequests } from "@/features/province-changes";
import { CoachRegistrationRequestsSection } from "@/features/students/components/coach-registration-requests-section";
import { useRegistrationRequests } from "@/features/students/hooks/use-registration-requests";
import { CoachTransfersSection, useTransferRequests } from "@/features/transfers";

type RequestType = "all" | "registration" | "transfer" | "photo" | "province";
type RequestStatus = "all" | "PENDING" | "APPROVED" | "REJECTED";

const typeTabs = [
  { id: "all", label: "همه" },
  { id: "registration", label: "ثبت هنرجو" },
  { id: "transfer", label: "انتقال هنرجو" },
  { id: "photo", label: "تغییر عکس" },
  { id: "province", label: "تغییر استان" },
];

const statusTabs = [
  { id: "all", label: "همه" },
  { id: "PENDING", label: "در انتظار تأیید" },
  { id: "APPROVED", label: "تأیید شده" },
  { id: "REJECTED", label: "رد شده" },
];

// Every request a coach has raised (or received) in one page: student
// registrations, transfers, photo and province changes — filterable by type
// and by status.
export function CoachRequestsScreen() {
  const [typeFilter, setTypeFilter] = useState<RequestType>("all");
  const [statusFilter, setStatusFilter] = useState<RequestStatus>("all");

  const { requests, isLoading, error, mutate } = useRegistrationRequests({ pageSize: 100 });
  const { result: transfers, isLoading: transfersLoading, error: transfersError, mutate: reloadTransfers } = useTransferRequests();
  const { result: photoResult, isLoading: photoLoading, error: photoError, mutate: reloadPhotoRequests } = usePhotoChangeRequests();
  const {
    result: provinceResult,
    isLoading: provinceLoading,
    error: provinceError,
    mutate: reloadProvinceRequests,
  } = useProvinceChangeRequests();
  const { belts } = useBelts();

  const transferRows = (transfers?.data ?? []).filter((request) => "direction" in request);
  const photoRows = (photoResult?.data ?? []).filter((request) => !("coachName" in request));
  const provinceRows = provinceResult?.data ?? [];

  const registrationCount = requests.length;
  const transferCount = transferRows.length;
  const photoCount = photoRows.length;
  const provinceCount = provinceRows.length;

  const typeCounts: Record<string, number> = {
    all: registrationCount + transferCount + photoCount + provinceCount,
    registration: registrationCount,
    transfer: transferCount,
    photo: photoCount,
    province: provinceCount,
  };

  const statusCounts: Record<string, number> = {
    all: typeCounts.all,
    PENDING: [requests, transferRows, photoRows, provinceRows].flat().filter((item) => item.status === "PENDING").length,
    APPROVED: [requests, transferRows, photoRows, provinceRows].flat().filter((item) => item.status === "APPROVED").length,
    REJECTED: [requests, transferRows, photoRows, provinceRows].flat().filter((item) => item.status === "REJECTED").length,
  };

  const statusMatches = (status: string) => statusFilter === "all" || status === statusFilter;
  const visibleRequests = requests.filter((request) => statusMatches(request.status));
  const visibleTransfers = transferRows.filter((request) => statusMatches(request.status));
  const visiblePhotos = photoRows.filter((request) => statusMatches(request.status));
  const visibleProvinces = provinceRows.filter((request) => statusMatches(request.status));

  return (
    <>
      <PageHeader title="درخواست ها" description="همه درخواست های شما و وضعیت آنها: ثبت هنرجو، انتقال، تغییر عکس و تغییر استان" />

      <ListToolbar tabs={typeTabs} counts={typeCounts} statusValue={typeFilter} onStatusChange={(id) => setTypeFilter(id as RequestType)} />
      <FilterTabs items={statusTabs} counts={statusCounts} value={statusFilter} onChange={(id) => setStatusFilter(id as RequestStatus)} />

      {typeFilter === "all" || typeFilter === "registration" ? (
        <CoachRegistrationRequestsSection
          requests={visibleRequests}
          belts={belts}
          isLoading={isLoading}
          error={error}
          onRetry={() => void mutate()}
        />
      ) : null}
      {typeFilter === "all" || typeFilter === "transfer" ? (
        <CoachTransfersSection
          requests={visibleTransfers}
          isLoading={transfersLoading}
          error={transfersError}
          onRetry={() => void reloadTransfers()}
        />
      ) : null}
      {typeFilter === "all" || typeFilter === "photo" ? (
        <CoachPhotoChangesSection
          requests={visiblePhotos}
          isLoading={photoLoading}
          error={photoError}
          onRetry={() => void reloadPhotoRequests()}
        />
      ) : null}
      {typeFilter === "all" || typeFilter === "province" ? (
        <CoachProvinceChangesSection
          requests={visibleProvinces}
          isLoading={provinceLoading}
          error={provinceError}
          onRetry={() => void reloadProvinceRequests()}
        />
      ) : null}
    </>
  );
}
