"use client";

import { ImageIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { BeltChip, DescriptionList, DetailPageHeader, ErrorBanner, SkeletonRows } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { personGenderLabels, useBelts } from "@/features/base-data";
import { formatJalaliDate } from "@/lib/format";
import { useStudent } from "../hooks/use-student";
import { useStudentDocuments } from "../hooks/use-student-documents";
import { studentDocumentTypes } from "../labels";
import { DocumentUploadCard } from "./document-upload-card";
import { StudentProfileStatus } from "./student-profile-status";
import { StudentRegistrationHistory } from "./student-registration-history";

function dateLabel(value: string | null): string {
  return value === null ? "ثبت نشده" : formatJalaliDate(new Date(value));
}

export function StudentProfileScreen({ studentId }: { studentId: string }) {
  const { student, isLoading, error, mutate } = useStudent(studentId);
  const { belts } = useBelts();
  const documents = useStudentDocuments(studentId, mutate);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <SkeletonRows rows={1} className="h-8" />
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <SkeletonRows rows={4} />
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex flex-col gap-4">
        <DetailPageHeader backHref="/coach/students" backLabel="هنرجویان" title="پروفایل هنرجو" />
        <ErrorBanner message="این هنرجو پیدا نشد یا به فهرست شما تعلق ندارد." onRetry={() => mutate()} />
      </div>
    );
  }

  const belt = belts.find((item) => item.id === student.beltId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <DetailPageHeader
        backHref="/coach/students"
        backLabel="هنرجویان"
        title={student.fullName}
        action={<StudentProfileStatus status={student.profileStatus} note={student.profileNote} />}
      />

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <UsersIcon aria-hidden className="size-4" />
          اطلاعات هنرجو
        </h2>
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <DescriptionList
            items={[
              { term: "نام و نام خانوادگی", value: student.fullName },
              { term: "کد ملی", value: <span className="tabular-nums">{student.nationalCode}</span> },
              { term: "جنسیت", value: personGenderLabels[student.gender] },
              { term: "تاریخ تولد", value: formatJalaliDate(new Date(student.birthDate)) },
              { term: "تاریخ بیمه ورزشی", value: dateLabel(student.insuranceDate) },
              { term: "تاریخ شارژ بانک اطلاعات تکواندو", value: dateLabel(student.tkdBankChargeDate) },
              { term: "کمربند", value: belt ? <BeltChip belt={belt} /> : "نامشخص" },
              { term: "تاریخ ثبت", value: formatJalaliDate(new Date(student.createdAt)) },
            ]}
          />
          <p className="mt-4 rounded-lg bg-muted/50 px-3 py-2 text-subtle text-muted-foreground">
            اطلاعات هنرجو پس از ثبت قابل تغییر نیست. کمربند را ادمین استان ثبت می کند.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <ImageIcon aria-hidden className="size-4" />
          مدارک هنرجو
        </h2>
        <p className="text-subtle text-muted-foreground">عکس پرسنلی و کارت ملی برای بررسی پروفایل الزامی است.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {studentDocumentTypes.map((type) => (
            <DocumentUploadCard
              key={type}
              studentId={student.id}
              type={type}
              uploaded={student.documents.some((document) => document.type === type)}
              working={documents.workingType === type}
              onUpload={documents.upload}
              onDelete={documents.remove}
            />
          ))}
        </div>
      </section>

      <StudentRegistrationHistory studentId={student.id} />

      <Button variant="outline" render={<Link href="/coach/students" />} className="w-fit">
        بازگشت به هنرجویان
      </Button>
    </div>
  );
}
