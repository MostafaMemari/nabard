"use client";

import { ArrowLeftRightIcon, FileSpreadsheetIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader, SearchInput } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useAgeCategories, useBelts } from "@/features/base-data";
import { TransferRequestDialog, useTransferRequests } from "@/features/transfers";
import { useSearchParamText } from "@/lib/use-search-param";
import { useStudents } from "../hooks/use-students";
import { birthDateInAgeCategory } from "../student-age";
import type { Student } from "../types";
import { StudentDeleteDialog } from "./student-delete-dialog";
import { StudentImportDialog } from "./student-import-dialog";
import { StudentsActiveFilters } from "./students-active-filters";
import { StudentsFilterSheet } from "./students-filter-sheet";
import { StudentsResults } from "./students-results";

export function StudentsScreen() {
  const router = useRouter();
  const search = useSearchParamText("q");
  const { students, isLoading, error, mutate } = useStudents();
  const { belts } = useBelts();
  const { ageCategories } = useAgeCategories();
  const [pendingDelete, setPendingDelete] = useState<Student | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [beltId, setBeltId] = useState("all");
  const [ageCategoryId, setAgeCategoryId] = useState("all");
  const { mutate: reloadTransfers } = useTransferRequests();

  const query = search.value.trim();
  const searched = students.filter((student) => query === "" || student.fullName.includes(query) || student.nationalCode.includes(query));
  const selectedCategory = ageCategories.find((category) => category.id === ageCategoryId);
  const rows = searched.filter(
    (student) =>
      (beltId === "all" || student.beltId === beltId) && (!selectedCategory || birthDateInAgeCategory(student.birthDate, selectedCategory)),
  );

  function openStudent(student: Student) {
    router.push(`/coach/students/${student.id}`);
  }

  return (
    <>
      <PageHeader
        title="هنرجویان"
        description="هنرجویان تأیید شده باشگاه شما؛ درخواست های ثبت، انتقال، عکس و استان در صفحه درخواست ها هستند"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setTransferOpen(true)}>
              <ArrowLeftRightIcon data-icon="inline-start" />
              انتقال هنرجو به من
            </Button>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <FileSpreadsheetIcon data-icon="inline-start" />
              وارد کردن با اکسل
            </Button>
            <Button render={<Link href="/coach/students/new" />}>
              <PlusIcon data-icon="inline-start" />
              هنرجوی جدید
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <SearchInput value={search.input} onChange={search.setInput} placeholder="جستجوی هنرجو" label="جستجوی هنرجو" />
        <StudentsFilterSheet
          students={searched}
          belts={belts}
          ageCategories={ageCategories}
          beltId={beltId}
          ageCategoryId={ageCategoryId}
          onBeltChange={setBeltId}
          onAgeCategoryChange={setAgeCategoryId}
          resultCount={rows.length}
        />
      </div>

      <StudentsActiveFilters
        belts={belts}
        ageCategories={ageCategories}
        beltId={beltId}
        ageCategoryId={ageCategoryId}
        onBeltChange={setBeltId}
        onAgeCategoryChange={setAgeCategoryId}
      />

      <StudentsResults
        rows={rows}
        belts={belts}
        isLoading={isLoading}
        error={error}
        onRetry={() => void mutate()}
        query={query}
        onOpen={openStudent}
        onDelete={setPendingDelete}
      />

      <StudentDeleteDialog student={pendingDelete} onDone={mutate} onClose={() => setPendingDelete(null)} />
      <StudentImportDialog open={importOpen} onOpenChange={setImportOpen} onImported={() => void mutate()} />
      <TransferRequestDialog open={transferOpen} onOpenChange={setTransferOpen} onRequested={() => void reloadTransfers()} />
    </>
  );
}
