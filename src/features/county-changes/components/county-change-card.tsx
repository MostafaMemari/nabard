"use client";

import { MobileCardLine, MobileCardTop, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { formatJalaliDate } from "@/lib/format";
import { countyChangeStatusKey } from "../labels";
import type { CountyChangeRequest } from "../types";

export function CountyChangeCard({
  request,
  onDecide,
}: {
  request: CountyChangeRequest;
  onDecide: (request: CountyChangeRequest, decision: "approve" | "reject") => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <MobileCardTop title={request.coachName} end={<StatusBadge status={countyChangeStatusKey(request.status)} />} />
      <MobileCardLine label="تغییر شهرستان" value={`${request.fromCountyName} → ${request.toCountyName}`} />
      {request.note ? <MobileCardLine label="توضیح" value={request.note} /> : null}
      <MobileCardLine label="تاریخ درخواست" value={formatJalaliDate(new Date(request.createdAt))} />
      {request.status === "PENDING" ? (
        <div className="flex items-center gap-3 border-t border-border pt-3">
          <Button
            variant="outline"
            className="h-11 flex-1 text-success hover:text-success sm:h-9"
            onClick={() => onDecide(request, "approve")}
          >
            تایید
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
