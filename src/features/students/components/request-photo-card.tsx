"use client";

import { ImageOffIcon } from "lucide-react";
import { useState } from "react";
import { ReceiptLightbox } from "@/features/payments";

// The personal photo a coach attached to a registration request. It is
// required for approval; a missing photo is the coach's action item.
export function RequestPhotoCard({ photoUrl }: { photoUrl: string | null }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-3 shadow-card">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">عکس پرسنلی</span>
          <span
            className={
              photoUrl
                ? "inline-flex h-6 items-center rounded-full bg-primary/10 px-2.5 text-subtle font-medium text-primary"
                : "inline-flex h-6 items-center rounded-full bg-warning-bg px-2.5 text-subtle font-medium text-warning"
            }
          >
            {photoUrl ? "بارگذاری شده" : "الزامی — بارگذاری نشده"}
          </span>
        </div>
        <button
          type="button"
          disabled={!photoUrl}
          onClick={() => setLightboxOpen(true)}
          className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-muted disabled:cursor-default"
          aria-label={photoUrl ? "مشاهده در اندازه اصلی" : "بارگذاری نشده"}
        >
          {photoUrl ? (
            // biome-ignore lint/performance/noImgElement: direct R2 url with an unguessable key
            <img src={photoUrl} alt="عکس پرسنلی" className="size-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1.5 text-subtle text-muted-foreground">
              <ImageOffIcon className="size-5" aria-hidden />
              مربی هنوز عکس پرسنلی را بارگذاری نکرده است
            </span>
          )}
        </button>
      </div>

      <ReceiptLightbox
        open={lightboxOpen}
        onOpenChange={(open) => {
          if (!open) setLightboxOpen(false);
        }}
        src={photoUrl ?? ""}
      />
    </>
  );
}
