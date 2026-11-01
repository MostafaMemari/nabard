"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader, SearchInput } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useBelts } from "@/features/base-data";
import { useSearchParamText } from "@/lib/use-search-param";
import { useStudents } from "../hooks/use-students";
import type { Student } from "../types";
import { StudentDeleteDialog } from "./student-delete-dialog";
import { StudentsResults } from "./students-results";

export function StudentsScreen() {
  const router = useRouter();
  const search = useSearchParamText("q");
  const { students, isLoading, error, mutate } = useStudents();
  const { belts } = useBelts();
  const [pendingDelete, setPendingDelete] = useState<Student | null>(null);

  const query = search.value.trim();
  const rows = students.filter((student) => query === "" || student.fullName.includes(query) || student.nationalCode.includes(query));

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

      <SearchInput value={search.input} onChange={search.setInput} placeholder="جستجوی هنرجو" label="جستجوی هنرجو" />

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
    </>
  );
}
