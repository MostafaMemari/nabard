"use client";

import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function DetailPageHeader({
  backHref,
  backLabel,
  title,
  description,
  action,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ms-2 w-fit text-muted-foreground"
        render={
          <Link href={backHref}>
            <ArrowRightIcon data-icon="inline-start" />
            {backLabel}
          </Link>
        }
      />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold leading-tight">{title}</h1>
          {description ? <p className="text-subtle text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </header>
    </div>
  );
}
