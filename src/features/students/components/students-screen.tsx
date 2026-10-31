"use client";

import { PlusIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DataTable, EmptyState, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBelts } from "@/features/base-data";
import { useStudents } from "../hooks/use-students";
import type { Student } from "../types";
import { StudentDeleteDialog } from "./student-delete-dialog";
import { StudentCardList } from "./students-card-list";
import { studentColumns } from "./students-columns";

export function StudentsScreen({ coachId }: { coachId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const { students, isLoading, error, mutate } = useStudents({ coachId });
  const { belts } = useBelts();
  const [pendingDelete, setPendingDelete] = useState<Student | null>(null);

  const query = search.trim();
  const rows = students.filter((student) => query === "" || student.fullName.includes(query) || student.nationalCode.includes(query));

  function setSearch(value: string) {
    const params = new URLSearchParams();
    if (value.trim() !== "") {
      params.set("q", value.trim());
    }
    const queryString = params.toString();
    router.replace(queryString === "" ? "/coach/students" : `/coach/students?${queryString}`, { scroll: false });
  }

  function openStudent(student: Student) {
    router.push(`/coach/students/${student.id}`);
  }

  return (
    <>
      <PageHeader
        title="هنرجویان"
        description="مدیریت هنرجویان باشگاه شما."
        action={
          <Button render={<Link href="/coach/students/new" />}>
            <PlusIcon data-icon="inline-start" />
            هنرجوی جدید
          </Button>
        }
      />

      <div className="relative md:max-w-xs">
        <SearchIcon aria-hidden className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value);
            setSearch(event.target.value);
          }}
          placeholder="جستجوی هنرجو"
          aria-label="جستجوی هنرجو"
          className="ps-9"
        />
      </div>

      {error ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          <span>دریافت اطلاعات ناموفق بود.</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void mutate()}>
            تلاش دوباره
          </Button>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
          {["s1", "s2", "s3", "s4", "s5"].map((key) => (
            <Skeleton key={key} className="h-13 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card shadow-card">
          <EmptyState
            title={query !== "" ? `نتیجه‌ای برای «${query}» پیدا نشد.` : "هنوز هنرجویی اضافه نکرده‌اید."}
            action={
              query === "" ? (
                <Button size="sm" render={<Link href="/coach/students/new" />}>
                  <PlusIcon data-icon="inline-start" />
                  هنرجوی جدید
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <DataTable
              columns={studentColumns({ belts, onDelete: setPendingDelete })}
              rows={rows}
              getRowId={(row) => row.id}
              onRowClick={openStudent}
            />
          </div>
          <div className="md:hidden">
            <StudentCardList rows={rows} onEdit={openStudent} onDelete={setPendingDelete} />
          </div>
        </>
      )}

      <StudentDeleteDialog student={pendingDelete} onDone={mutate} onClose={() => setPendingDelete(null)} />
    </>
  );
}
