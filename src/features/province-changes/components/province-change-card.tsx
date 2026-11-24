"use client";

import { MobileCard, MobileCardFooter, MobileCardLine, MobileCardTop, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { formatJalaliDate } from "@/lib/format";
import { provinceChangeStatusKey } from "../labels";
import type { ProvinceChangeRequest } from "../types";
import { ProvinceChangeRoute } from "./province-change-columns";

export function ProvinceChangeCard({
  request,
  onDecide,
}: {
  request: ProvinceChangeRequest;
  onDecide: (request: ProvinceChangeRequest, decision: "approve" | "reject") => void;
}) {
  return (
    <MobileCard>
      <MobileCardTop
        title={request.studentName}
        subtitle={request.fromCoachName}
        end={<StatusBadge status={provinceChangeStatusKey(request.status)} />}
      />
      <MobileCardLine label="مسیر" value={<ProvinceChangeRoute request={request} />} />
      <MobileCardLine label="مربی مقصد" value={request.toCoachName} />
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
