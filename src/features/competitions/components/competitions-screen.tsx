"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DataTable, ListToolbar, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useCompetitionsView } from "./use-competitions-view";

export function CompetitionsScreen() {
  const router = useRouter();
  const view = useCompetitionsView();

  return (
    <>
      <PageHeader
        title="مسابقات"
        description="مدیریت مسابقات و مهلت ثبت‌نام آن‌ها."
        action={
          <Button render={<Link href="/admin/competitions/new" />}>
            <PlusIcon data-icon="inline-start" />
            مسابقه جدید
          </Button>
        }
      />

      <DataTable
        columns={view.columns}
        rows={view.rows}
        getRowId={(row) => row.id}
        isLoading={view.isLoading}
        error={view.error}
        onRetry={() => view.retry()}
        onRowClick={(row) => router.push(`/admin/competitions/${row.id}`)}
        emptyTitle={
          view.search.value.trim() !== "" ? `نتیجه‌ای برای «${view.search.value.trim()}» پیدا نشد.` : "هنوز مسابقه‌ای ثبت نشده است."
        }
        emptyAction={
          <Button render={<Link href="/admin/competitions/new" />} size="sm">
            <PlusIcon data-icon="inline-start" />
            مسابقه جدید
          </Button>
        }
        toolbar={
          <ListToolbar
            tabs={view.tabs}
            counts={view.counts}
            statusValue={view.statusValue}
            onStatusChange={view.onStatusChange}
            search={view.search}
            searchLabel="جستجوی مسابقه"
          />
        }
      />
    </>
  );
}
