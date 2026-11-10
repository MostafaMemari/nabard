"use client";

import { ImageOffIcon } from "lucide-react";
import { Avatar, type DataTableColumn, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { formatJalaliDate } from "@/lib/format";
import { photoChangeFileUrl } from "../api";
import { photoChangeStatusKey } from "../labels";
import type { PhotoChangeRequest } from "../types";

// Thumbnail of the pending photo, streamed from the authenticated file
// endpoint with the session cookie. Decided rows whose photo was purged from
// storage show a quiet placeholder instead of a broken image.
export function PhotoChangeThumb({ requestId, className = "size-10" }: { requestId: string; className?: string }) {
  return (
    // biome-ignore lint/performance/noImgElement: authenticated session-cookie url, not a static import
    <img
      src={photoChangeFileUrl(requestId)}
      alt="عکس درخواستی"
      className={`${className} rounded-lg border border-border object-cover`}
      loading="lazy"
    />
  );
}

export function PhotoChangeThumbOrEmpty({ request, className = "size-10" }: { request: PhotoChangeRequest; className?: string }) {
  if (request.newFileId === null) {
    return (
      <span
        aria-hidden
        className={`${className} flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground`}
      >
        <ImageOffIcon className="size-4" />
      </span>
    );
  }

  return <PhotoChangeThumb requestId={request.id} className={className} />;
}

export function usePhotoChangeColumns({
  onDecide,
}: {
  onDecide: (request: PhotoChangeRequest, decision: "approve" | "reject") => void;
}): DataTableColumn<PhotoChangeRequest>[] {
  return [
    {
      id: "photo",
      header: "عکس جدید",
      cell: (row) => <PhotoChangeThumbOrEmpty request={row} />,
    },
    {
      id: "student",
      header: "هنرجو",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar id={row.studentId} name={row.studentName} size="sm" />
          <span className="font-medium">{row.studentName}</span>
        </div>
      ),
      sortValue: (row) => row.studentName,
    },
    {
      id: "coach",
      header: "مربی",
      cell: (row) => <span className="whitespace-nowrap">{row.coachName}</span>,
    },
    { id: "createdAt", header: "تاریخ درخواست", cell: (row) => formatJalaliDate(new Date(row.createdAt)), minScreen: "lg" },
    { id: "status", header: "وضعیت", cell: (row) => <StatusBadge status={photoChangeStatusKey(row.status)} /> },
    {
      id: "actions",
      header: "عملیات",
      cell: (row) =>
        row.status === "PENDING" ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-success hover:text-success"
              onClick={(event) => {
                event.stopPropagation();
                onDecide(row, "approve");
              }}
            >
              تأیید
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-danger hover:text-danger"
              onClick={(event) => {
                event.stopPropagation();
                onDecide(row, "reject");
              }}
            >
              رد
            </Button>
          </div>
        ) : null,
    },
  ];
}
