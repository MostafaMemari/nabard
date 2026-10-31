"use client";

import { LockIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";

export function CompetitionFormLocked({ competitionId }: { competitionId: string }) {
  return (
    <section className="mx-auto w-full max-w-2xl">
      <PageHeader title="ویرایش مسابقه" />
      <div className="mt-4 rounded-xl border border-border bg-card shadow-card">
        <EmptyState
          icon={<LockIcon aria-hidden />}
          title="این مسابقه ثبت‌نام دارد و اطلاعات آن قابل ویرایش نیست."
          action={
            <Button render={<Link href={`/admin/competitions/${competitionId}`} />} size="sm" variant="outline">
              بازگشت به جزئیات مسابقه
            </Button>
          }
        />
      </div>
    </section>
  );
}
