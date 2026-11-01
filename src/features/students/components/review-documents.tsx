"use client";

import { ImageOffIcon } from "lucide-react";
import { useState } from "react";
import { ReceiptLightbox } from "@/features/payments";
import { buildApiUrl } from "@/lib/http";
import { studentDocumentLabels, studentDocumentTypes } from "../labels";
import { requiredDocumentTypes, type StudentDocument, type StudentDocumentType } from "../types";

function documentUrl(studentId: string, type: StudentDocumentType): string {
  return buildApiUrl(`/api/v1/students/${studentId}/documents/${type}/file`);
}

export function ReviewDocuments({ studentId, documents }: { studentId: string; documents: StudentDocument[] }) {
  const [lightbox, setLightbox] = useState<StudentDocumentType | null>(null);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {studentDocumentTypes.map((type) => {
        const uploaded = documents.some((document) => document.type === type);
        const required = requiredDocumentTypes.includes(type);

        return (
          <div key={type} className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-3 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{studentDocumentLabels[type]}</span>
              <span
                className={
                  required
                    ? "inline-flex h-6 items-center rounded-full bg-warning-bg px-2.5 text-subtle font-medium text-warning"
                    : "text-subtle text-muted-foreground"
                }
              >
                {required ? "الزامی" : "اختیاری"}
              </span>
            </div>
            <button
              type="button"
              disabled={!uploaded}
              onClick={() => setLightbox(type)}
              className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-muted disabled:cursor-default"
              aria-label={uploaded ? "مشاهده در اندازه اصلی" : "بارگذاری نشده"}
            >
              {uploaded ? (
                // biome-ignore lint/performance/noImgElement: private document served by an authenticated endpoint
                <img src={documentUrl(studentId, type)} alt={studentDocumentLabels[type]} className="size-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-1.5 text-subtle text-muted-foreground">
                  <ImageOffIcon className="size-5" aria-hidden />
                  بارگذاری نشده
                </span>
              )}
            </button>
          </div>
        );
      })}

      <ReceiptLightbox
        open={lightbox !== null}
        onOpenChange={(open) => {
          if (!open) setLightbox(null);
        }}
        src={lightbox ? documentUrl(studentId, lightbox) : ""}
      />
    </div>
  );
}
