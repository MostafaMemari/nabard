"use client";

import { ImageUpIcon } from "lucide-react";
import { useState } from "react";
import { DataTable, ListToolbar, PageHeader } from "@/components/shared";
import { useSearchParam } from "@/lib/use-search-param";
import { usePhotoChangeRequests } from "../hooks/use-photo-changes";
import { photoChangeTabs } from "../tabs";
import type { PhotoChangeRequest } from "../types";
import { PhotoChangeCard } from "./photo-change-card";
import { usePhotoChangeColumns } from "./photo-change-columns";
import { PhotoChangeDecisionDialog } from "./photo-change-decision-dialog";

type Decision = { request: PhotoChangeRequest; decision: "approve" | "reject" };

export function PhotoChangesScreen() {
  const [statusFilter, setStatusFilter] = useSearchParam("status");
  const [target, setTarget] = useState<Decision | null>(null);
  const { result, isLoading, error, mutate } = usePhotoChangeRequests();
  const requests = (result?.data ?? []).filter((request): request is PhotoChangeRequest => "coachName" in request);
  const columns = usePhotoChangeColumns({
    onDecide: (request, decision) => setTarget({ request, decision }),
  });

  const counts = {
    all: requests.length,
    pending: requests.filter((request) => request.status === "PENDING").length,
    approved: requests.filter((request) => request.status === "APPROVED").length,
    rejected: requests.filter((request) => request.status === "REJECTED").length,
  };

  const activeTab = photoChangeTabs.find((tab) => tab.id === (statusFilter || "all"));
  const rows = activeTab?.status ? requests.filter((request) => request.status === activeTab.status) : requests;

  return (
    <>
      <PageHeader
        title="درخواست های تغییر عکس"
        description="عکس جدید هنرجویان استان را بررسی کنید؛ عکس پروفایل فقط با تأیید شما جایگزین می شود"
      />

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        error={error}
        onRetry={() => mutate()}
        renderCard={(row) => <PhotoChangeCard request={row} onDecide={(request, decision) => setTarget({ request, decision })} />}
        emptyIcon={ImageUpIcon}
        emptyTitle="درخواست تغییر عکسی ثبت نشده است"
        toolbar={
          <ListToolbar
            tabs={photoChangeTabs}
            counts={counts}
            statusValue={activeTab?.id ?? "all"}
            onStatusChange={(id) => setStatusFilter(id === "all" ? null : id)}
          />
        }
      />

      <PhotoChangeDecisionDialog
        request={target?.request ?? null}
        decision={target?.decision ?? "approve"}
        onClose={() => setTarget(null)}
        onDecided={() => void mutate()}
      />
    </>
  );
}
