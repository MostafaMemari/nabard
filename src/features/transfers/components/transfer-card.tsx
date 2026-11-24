"use client";

import { MobileCardLine, MobileCardTop, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { formatJalaliDate } from "@/lib/format";
import { transferStatusKey } from "../labels";
import type { TransferRequest } from "../types";

export function TransferCard({
  request,
  onDecide,
}: {
  request: TransferRequest;
  onDecide: (request: TransferRequest, decision: "approve" | "reject") => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <div className="p-4 pb-2.5">
        <MobileCardTop title={request.studentName} end={<StatusBadge status={transferStatusKey(request.status)} />} />
      </div>
      <div className="flex flex-col gap-2.5 px-4 pb-4">
        <MobileCardLine label="انتقال" value={`${request.fromCoachName} → ${request.toCoachName}`} />
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
