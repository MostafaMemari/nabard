"use client";

import { ChevronLeftIcon } from "lucide-react";
import { Avatar, MobileCardLine, StatusBadge } from "@/components/shared";
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
    <div className="rounded-xl border border-border bg-card shadow-card">
      <div className="p-4 pb-2.5">
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
      </div>
      <div className="flex flex-col gap-2.5 px-4 pb-4">
        <MobileCardLine label="تغییر شهرستان" value={`${request.fromCountyName} → ${request.toCountyName}`} />
        {request.note ? <MobileCardLine label="توضیح" value={request.note} /> : null}
        <MobileCardLine label="تاریخ درخواست" value={formatJalaliDate(new Date(request.createdAt))} />
      </div>
      {request.status === "PENDING" ? (
        <div className="flex items-center gap-3 border-t border-border px-4 pt-3 pb-4">
          <Button
            variant="outline"
            className="h-11 flex-1 text-success hover:text-success sm:h-9"
            onClick={() => onDecide(request, "approve")}
          >
            تأیید
          </Button>
          <Button
            variant="outline"
            className="h-11 flex-1 text-danger hover:text-danger sm:h-9"
            onClick={() => onDecide(request, "reject")}
          >
            رد
          </Button>
        </div>
      ) : null}
    </div>
  );
}
