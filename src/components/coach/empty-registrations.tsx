"use client";

import { ClipboardListIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";

export function EmptyRegistrations() {
  return (
    <EmptyState
      icon={ClipboardListIcon}
      title="هنوز ثبت‌نامی انجام نشده است."
      action={
        <Button size="sm" render={<Link href="/coach/competitions" />}>
          مشاهده مسابقات باز
        </Button>
      }
    />
  );
}
