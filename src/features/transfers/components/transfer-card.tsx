"use client";

import { MobileCard, MobileCardFooter, MobileCardLine, MobileCardTop, StatusBadge } from "@/components/shared";
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
    <MobileCard>
      <MobileCardTop title={request.studentName} end={<StatusBadge status={transferStatusKey(request.status)} />} />
      <MobileCardLine label="انتقال" value={`${request.fromCoachName} → ${request.toCoachName}`} />
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
