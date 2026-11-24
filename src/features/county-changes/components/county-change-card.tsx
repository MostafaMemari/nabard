"use client";

import { ChevronLeftIcon } from "lucide-react";
import { Avatar, MobileCard, MobileCardFooter, MobileCardLine, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { formatJalaliDate } from "@/lib/format";
import { countyChangeStatusKey } from "../labels";
import type { CountyChangeRequest } from "../types";

export function CountyChangeCard({
  request,
  onDecide,
  onOpenCoach,
}: {
  request: CountyChangeRequest;
  onDecide: (request: CountyChangeRequest, decision: "approve" | "reject") => void;
  onOpenCoach: () => void;
}) {
  return (
    <MobileCard>
      <button
        type="button"
        onClick={onOpenCoach}
        className="flex w-full items-center gap-3 rounded-lg text-start transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <Avatar id={request.coachId} name={request.coachName} size="md" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{request.coachName}</span>
        <StatusBadge status={countyChangeStatusKey(request.status)} />
        <ChevronLeftIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      </button>
      <MobileCardLine label="تغییر شهرستان" value={`${request.fromCountyName} → ${request.toCountyName}`} />
      {request.note ? <MobileCardLine label="توضیح" value={request.note} /> : null}
      <MobileCardLine label="تاریخ درخواست" value={formatJalaliDate(new Date(request.createdAt))} />
      {request.status === "PENDING" ? (
        <MobileCardFooter>
          <Button variant="outline" className="h-11 flex-1 sm:h-9" onClick={() => onDecide(request, "approve")}>
            تأیید
          </Button>
          <Button variant="destructive" className="h-11 flex-1 sm:h-9" onClick={() => onDecide(request, "reject")}>
            رد
          </Button>
        </MobileCardFooter>
      ) : null}
    </MobileCard>
  );
}
