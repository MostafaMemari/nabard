"use client";

import { useBelts } from "@/features/base-data";
import { usePhotoChangeRequests } from "@/features/photo-changes";
import { useProvinceChangeRequests } from "@/features/province-changes";
import { useRegistrationRequests } from "@/features/students/hooks/use-registration-requests";
import { useTransferRequests } from "@/features/transfers";
import type { RequestKind, RequestListRow } from "./request-rows";

// One row per request across the four kinds, so the coach sees everything in
// a single list instead of four separate cards.
export function useRequestRows() {
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

  const rows: RequestListRow[] = [
    ...requests.map((request): RequestListRow => {
      const belt = belts.find((item) => item.id === request.beltId);
      return {
        key: `registration-${request.id}`,
        kind: "registration",
        id: request.id,
        title: `ثبت «${request.fullName}»`,
        subtitle: `کد ملی ${request.nationalCode}${belt ? ` — ${belt.label}` : ""}`,
        note: request.reviewNote,
        photoMissing: request.status !== "APPROVED" && !request.photoUrl,
        createdAt: request.createdAt,
        status: request.status,
      };
    }),
    ...(transfers?.data ?? [])
      .filter((request) => "direction" in request)
      .map(
        (request): RequestListRow => ({
          key: `transfer-${request.id}`,
          kind: "transfer",
          id: request.id,
          title: request.studentName ? `انتقال «${request.studentName}»` : "درخواست انتقال هنرجو",
          subtitle: request.direction === "incoming" ? "درخواست از مربی دیگر" : null,
          note: request.note,
          photoMissing: false,
          createdAt: request.createdAt,
          status: request.status,
        }),
      ),
    ...(photoResult?.data ?? [])
      .filter((request) => !("coachName" in request))
      .map(
        (request): RequestListRow => ({
          key: `photo-${request.id}`,
          kind: "photo",
          id: request.id,
          title: request.studentName ? `تغییر عکس «${request.studentName}»` : "درخواست تغییر عکس",
          subtitle: null,
          note: request.note,
          photoMissing: false,
          createdAt: request.createdAt,
          status: request.status,
        }),
      ),
    ...(provinceResult?.data ?? []).map(
      (request): RequestListRow => ({
        key: `province-${request.id}`,
        kind: "province",
        id: request.id,
        title: `تغییر استان «${request.studentName}»`,
        subtitle: null,
        note: request.note,
        photoMissing: false,
        createdAt: request.createdAt,
        status: request.status,
      }),
    ),
  ].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  const refreshAll = () => {
    void mutate();
    void reloadTransfers();
    void reloadPhotoRequests();
    void reloadProvinceRequests();
  };

  return {
    rows,
    isLoading: isLoading || transfersLoading || photoLoading || provinceLoading,
    error: error ?? transfersError ?? photoError ?? provinceError,
    mutate,
    refreshAll,
  };
}
