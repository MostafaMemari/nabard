"use client";

import { ArrowLeftRightIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BeltDot, FilterTabs, PageHeader, SearchInput } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useBelts } from "@/features/base-data";
import type { CoachTransferRequest } from "@/features/transfers";
import { CoachTransfersSection, TransferRequestDialog, useTransferRequests } from "@/features/transfers";
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
  const [transferOpen, setTransferOpen] = useState(false);
  const [beltId, setBeltId] = useState("all");
  const { result: transfers, isLoading: transfersLoading, error: transfersError, mutate: reloadTransfers } = useTransferRequests();

  const coachRequests = (transfers?.data ?? []).filter((request): request is CoachTransferRequest => "direction" in request);

  const query = search.value.trim();
  const searched = students.filter((student) => query === "" || student.fullName.includes(query) || student.nationalCode.includes(query));
  const rows = searched.filter((student) => beltId === "all" || student.beltId === beltId);
  const beltCounts: Record<string, number> = { all: searched.length };
  for (const student of searched) {
    beltCounts[student.beltId] = (beltCounts[student.beltId] ?? 0) + 1;
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
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setTransferOpen(true)}>
              <ArrowLeftRightIcon data-icon="inline-start" />
              انتقال هنرجو به من
            </Button>
            <Button render={<Link href="/coach/students/new" />}>
              <PlusIcon data-icon="inline-start" />
              هنرجوی جدید
            </Button>
          </div>
        }
      />

      <SearchInput value={search.input} onChange={search.setInput} placeholder="جستجوی هنرجو" label="جستجوی هنرجو" />

      <FilterTabs
        value={beltId}
        onChange={setBeltId}
        scroll
        counts={beltCounts}
        items={[
          { id: "all", label: "همه کمربندها" },
          ...belts.map((belt) => ({ id: belt.id, label: belt.label, dot: <BeltDot code={belt.code} /> })),
        ]}
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

      <CoachTransfersSection
        requests={coachRequests}
        isLoading={transfersLoading}
        error={transfersError}
        onRetry={() => void reloadTransfers()}
      />

      <StudentDeleteDialog student={pendingDelete} onDone={mutate} onClose={() => setPendingDelete(null)} />
      <TransferRequestDialog open={transferOpen} onOpenChange={setTransferOpen} onRequested={() => void reloadTransfers()} />
    </>
  );
}
