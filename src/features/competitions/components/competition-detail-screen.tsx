"use client";

import { ArrowRightIcon, BanIcon, PencilIcon, SendIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog, DeadlineChip, DescriptionList, FormSection, PageHeader, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ageCategoryLabel, genderLabels, useBelts, useWeightClasses } from "@/features/base-data";
import { useRegistrations } from "@/features/registrations";
import { formatJalaliDate, formatRialsAsToman } from "@/lib/format";
import { updateCompetitionStatus } from "../api";
import { useCompetition } from "../hooks/use-competitions";
import { disciplineLabels } from "../labels";
import { BeltChips } from "./belt-chips";
import { CompetitionRegistrations } from "./competition-registrations";

export function CompetitionDetailScreen({ competitionId }: { competitionId: string }) {
  const { competition, isLoading, error, mutate } = useCompetition(competitionId);
  const { registrations } = useRegistrations();
  const { belts } = useBelts();
  const { weightClasses } = useWeightClasses(competition ? { ageCategoryId: competition.ageCategoryId, gender: competition.gender } : {});
  const [pendingAction, setPendingAction] = useState<"publish" | "cancel" | null>(null);
  const [working, setWorking] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-52 w-full" />
        </div>
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
        مسابقه یافت نشد.
        <Button type="button" variant="ghost" size="sm" className="ms-2" onClick={() => mutate()}>
          تلاش دوباره
        </Button>
      </div>
    );
  }

  const hasRegistrations = registrations.some((registration) => registration.competitionId === competitionId);

  async function runStatusUpdate(status: "PUBLISHED" | "CANCELED", successMessage: string) {
    setWorking(true);
    try {
      await updateCompetitionStatus(competitionId, status);
      toast.success(successMessage);
      await mutate();
      setPendingAction(null);
    } catch {
      toast.error("انجام نشد. دوباره تلاش کنید.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ms-2 w-fit text-muted-foreground"
        render={
          <Link href="/admin/competitions">
            <ArrowRightIcon data-icon="inline-start" />
            مسابقات
          </Link>
        }
      />

      <PageHeader
        title={competition.title}
        description={`${disciplineLabels[competition.discipline]} · ${genderLabels[competition.gender]} · رده ${ageCategoryLabel(competition.ageCategoryId)}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {hasRegistrations ? (
              <Button variant="outline" disabled>
                <PencilIcon data-icon="inline-start" />
                ویرایش
              </Button>
            ) : (
              <Button variant="outline" render={<Link href={`/admin/competitions/${competitionId}/edit`} />}>
                <PencilIcon data-icon="inline-start" />
                ویرایش
              </Button>
            )}
            {competition.status === "DRAFT" ? (
              <Button onClick={() => setPendingAction("publish")}>
                <SendIcon data-icon="inline-start" />
                انتشار
              </Button>
            ) : null}
            {competition.status === "PUBLISHED" ? (
              <Button variant="outline" className="text-danger" onClick={() => setPendingAction("cancel")}>
                <BanIcon data-icon="inline-start" />
                لغو مسابقه
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex items-center gap-3">
          <StatusBadge status={competition.status} />
          <DeadlineChip deadline={competition.registrationDeadline} />
        </div>
        {hasRegistrations ? <p className="text-subtle text-muted-foreground">به دلیل وجود ثبت‌نام، ویرایش این مسابقه ممکن نیست.</p> : null}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <FormSection title="شرکت‌کنندگان">
          <DescriptionList
            items={[
              { term: "رشته", value: disciplineLabels[competition.discipline] },
              { term: "جنسیت", value: genderLabels[competition.gender] },
              { term: "رده سنی", value: ageCategoryLabel(competition.ageCategoryId) },
              { term: "رده‌های وزنی", value: `${weightClasses.length} رده` },
              {
                term: "کمربندها",
                value: <BeltChips belts={belts} ids={competition.beltIds} />,
              },
            ]}
          />
        </FormSection>

        <FormSection title="زمان و پرداخت">
          <DescriptionList
            items={[
              { term: "مهلت ثبت‌نام", value: formatJalaliDate(new Date(competition.registrationDeadline)) },
              { term: "تاریخ برگزاری", value: formatJalaliDate(new Date(competition.eventDate)) },
              { term: "هزینه هر هنرجو", value: formatRialsAsToman(Number(competition.feePerStudent)) },
              { term: "شماره کارت", value: formatCardNumber(competition.payeeCardNumber) },
              { term: "صاحب کارت", value: competition.payeeCardHolder },
            ]}
          />
        </FormSection>
      </div>

      <CompetitionRegistrations competitionId={competitionId} ageCategoryId={competition.ageCategoryId} gender={competition.gender} />

      <ConfirmDialog
        open={pendingAction === "publish"}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null);
          }
        }}
        title="انتشار مسابقه"
        description="با انتشار مسابقه، مربیان می‌توانند هنرجویان خود را ثبت‌نام کنند. اطلاعات مسابقه پس از شروع ثبت‌نام قابل تغییر نیست."
        confirmLabel="انتشار"
        loading={working}
        onConfirm={() => runStatusUpdate("PUBLISHED", "مسابقه منتشر شد.")}
      />

      <ConfirmDialog
        open={pendingAction === "cancel"}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null);
          }
        }}
        title="لغو مسابقه"
        description="با لغو مسابقه، از فهرست مسابقات باز مربیان حذف می‌شود و ثبت‌نام جدید ممکن نخواهد بود. این اقدام قابل بازگشت نیست."
        confirmLabel="لغو مسابقه"
        destructive
        loading={working}
        onConfirm={() => runStatusUpdate("CANCELED", "مسابقه لغو شد.")}
      />
    </div>
  );
}

function formatCardNumber(cardNumber: string): string {
  return cardNumber.replace(/(\d{4})(?=\d)/g, "$1-").replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}
