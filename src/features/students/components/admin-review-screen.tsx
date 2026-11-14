"use client";

import { UserCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { DataTable, ListToolbar, PageHeader } from "@/components/shared";
import { useSearchParam } from "@/lib/use-search-param";
import { usePendingReview } from "../hooks/use-pending-review";
import { profileReviewTabs } from "../tabs";
import { AdminReviewCard } from "./admin-review-card";
import { useAdminReviewColumns } from "./admin-review-columns";

export function AdminReviewScreen() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useSearchParam("status");
  const { students, isLoading, error, mutate } = usePendingReview();
  const columns = useAdminReviewColumns();

  const counts = {
    all: students.length,
    pending: students.filter((student) => student.status === "PENDING").length,
    rejected: students.filter((student) => student.status === "REJECTED").length,
  };

  const activeTab = profileReviewTabs.find((tab) => tab.id === statusFilter);
  const rows = activeTab?.status ? students.filter((student) => student.status === activeTab.status) : students;

  return (
    <>
      <PageHeader title="بررسی پروفایل ها" description="درخواست های ثبت هنرجو را بررسی و تأیید یا رد کنید" />

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        error={error}
        onRetry={() => mutate()}
        onRowClick={(row) => router.push(`/admin/profiles/${row.id}`)}
        renderCard={(row) => <AdminReviewCard student={row} href={`/admin/profiles/${row.id}`} />}
        emptyIcon={UserCheckIcon}
        emptyTitle="درخواستی برای بررسی وجود ندارد"
        toolbar={
          <ListToolbar
            tabs={profileReviewTabs}
            counts={counts}
            statusValue={activeTab?.id ?? "all"}
            onStatusChange={(id) => setStatusFilter(id === "all" ? null : id)}
          />
        }
      />
    </>
  );
}
