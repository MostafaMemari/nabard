"use client";

import { LockIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState, FormContainer, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";

export function CompetitionFormLocked({ competitionId }: { competitionId: string }) {
  return (
    <FormContainer variant="standard">
      <PageHeader title="ویرایش مسابقه" description="اطلاعات این مسابقه پس از شروع ثبت نام قفل می شود." />
      <div className="mt-4 rounded-xl border border-border bg-card shadow-card">
        <EmptyState
          icon={LockIcon}
          tone="warning"
          title="این مسابقه ثبت نام دارد و اطلاعات آن قابل ویرایش نیست."
          action={
            <Button render={<Link href={`/admin/competitions/${competitionId}`} />} size="sm" variant="outline">
              بازگشت به جزئیات مسابقه
            </Button>
          }
        />
      </div>
    </FormContainer>
  );
}
