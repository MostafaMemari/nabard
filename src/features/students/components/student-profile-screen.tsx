"use client";

import type { LucideIcon } from "lucide-react";
import { ImageIcon, LandmarkIcon, LockIcon, MedalIcon, ShieldCheckIcon, UserIcon } from "lucide-react";
import type { ReactNode } from "react";
import { BeltDot, DetailPageHeader, ErrorBanner, IconTile, SkeletonRows, StatusBadge } from "@/components/shared";
import { personGenderLabels, useBelts } from "@/features/base-data";
import { formatJalaliDate } from "@/lib/format";
import { buildApiUrl } from "@/lib/http";
import { useStudent } from "../hooks/use-student";
import { useStudentDocuments } from "../hooks/use-student-documents";
import { studentDocumentTypes } from "../labels";
import { profileStatusKey } from "../types";
import { DocumentUploadCard } from "./document-upload-card";
import { StudentRegistrationHistory } from "./student-registration-history";

function dateValue(value: string | null): ReactNode {
  return value === null ? <span className="font-normal text-muted-foreground">ثبت نشده</span> : formatJalaliDate(new Date(value));
}

function FieldTile({ icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
      <IconTile icon={icon} size="sm" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="truncate text-sm font-medium">{value}</span>
      </div>
    </div>
  );
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
  const hasPhoto = student.documents.some((document) => document.type === "PHOTO");
  const photoUrl = buildApiUrl(`/api/v1/students/${student.id}/documents/PHOTO/file`);

  return (
    <div className="flex flex-col gap-6">
      <DetailPageHeader backHref="/coach/students" backLabel="هنرجویان" title="پروفایل هنرجو" />

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-4">
          {hasPhoto ? (
            // biome-ignore lint/performance/noImgElement: private document served by an authenticated endpoint
            <img src={photoUrl} alt={student.fullName} className="size-16 shrink-0 rounded-full bg-muted object-cover" />
          ) : (
            <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary">
              <UserIcon aria-hidden className="size-7" />
            </span>
          )}
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{student.fullName}</h2>
              <StatusBadge status={profileStatusKey(student.profileStatus)} />
            </div>
            <p className="text-sm text-muted-foreground">
              {personGenderLabels[student.gender]} · متولد {formatJalaliDate(new Date(student.birthDate))} · کد ملی{" "}
              <span className="tabular-nums">{student.nationalCode}</span> · تاریخ ثبت {formatJalaliDate(new Date(student.createdAt))}
            </p>
          </div>
        </div>

        {student.profileStatus === "REJECTED" && student.profileNote ? (
          <p className="rounded-lg bg-warning-bg px-3 py-2 text-subtle text-warning">{student.profileNote}</p>
        ) : null}

        <p className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary-subtle px-3 py-2.5 text-subtle text-primary">
          <LockIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
          اطلاعات این پروفایل پس از ثبت قابل ویرایش نیست؛ کمربند را ادمین استان ثبت می کند.
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <FieldTile icon={ShieldCheckIcon} label="تاریخ بیمه ورزشی" value={dateValue(student.insuranceDate)} />
        <FieldTile icon={LandmarkIcon} label="تاریخ شارژ بانک اطلاعات تکواندو" value={dateValue(student.tkdBankChargeDate)} />
        <FieldTile
          icon={MedalIcon}
          label="کمربند"
          value={
            belt ? (
              <span className="flex items-center gap-1.5">
                <BeltDot code={belt.code} />
                {belt.label}
              </span>
            ) : (
              "نامشخص"
            )
          }
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <ImageIcon aria-hidden className="size-4" />
          مدارک هنرجو
        </h2>
        <p className="text-subtle text-muted-foreground">عکس پرسنلی و کارت ملی برای بررسی پروفایل الزامی است.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}
