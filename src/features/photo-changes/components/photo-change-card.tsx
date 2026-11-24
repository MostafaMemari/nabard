"use client";

import { MobileCard, MobileCardFooter, MobileCardLine, MobileCardTop, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { formatJalaliDate } from "@/lib/format";
import { photoChangeStatusKey } from "../labels";
import type { PhotoChangeRequest } from "../types";
import { PhotoChangeThumbOrEmpty } from "./photo-change-columns";

export function PhotoChangeCard({
  request,
  onDecide,
}: {
  request: PhotoChangeRequest;
  onDecide: (request: PhotoChangeRequest, decision: "approve" | "reject") => void;
}) {
  return (
    <MobileCard>
      <MobileCardTop
        leading={<PhotoChangeThumbOrEmpty request={request} className="size-12 shrink-0" />}
        title={request.studentName}
        subtitle={request.coachName}
        end={<StatusBadge status={photoChangeStatusKey(request.status)} />}
      />
      <MobileCardLine label="تاریخ درخواست" value={formatJalaliDate(new Date(request.createdAt))} />
      {request.note ? <MobileCardLine label="توضیح" value={request.note} /> : null}
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
