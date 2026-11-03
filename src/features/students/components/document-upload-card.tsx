"use client";

import { ImageOffIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ACCEPTED_RECEIPT_TYPES } from "@/features/registrations";
import { studentDocumentLabels } from "../labels";
import { requiredDocumentTypes, type StudentDocumentType } from "../types";

export function DocumentUploadCard({
  type,
  url,
  uploaded,
  working,
  onUpload,
  onDelete,
}: {
  type: StudentDocumentType;
  url: string | null;
  uploaded: boolean;
  working: boolean;
  onUpload: (type: StudentDocumentType, file: File) => void;
  onDelete: (type: StudentDocumentType) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const required = requiredDocumentTypes.includes(type);

  function selectFile(file: File | null) {
    if (!file) return;

    if (!ACCEPTED_RECEIPT_TYPES.has(file.type)) {
      setError("فقط تصاویر JPEG، PNG یا WebP پذیرفته می شوند.");
      return;
    }

    setError(null);
    onUpload(type, file);
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-3 shadow-card">
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

      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-muted">
        {url ? (
          // biome-ignore lint/performance/noImgElement: direct R2 url with an unguessable key
          <img src={url} alt={studentDocumentLabels[type]} className="size-full object-cover" />
        ) : (
          <ImageOffIcon className="size-6 text-muted-foreground" aria-hidden />
        )}
      </div>

      {error ? <p className="text-subtle text-danger">{error}</p> : null}

      <div className="flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" className="flex-1" disabled={working} onClick={() => inputRef.current?.click()}>
          <UploadIcon data-icon="inline-start" />
          {working ? "در حال ذخیره…" : uploaded ? "جایگزینی" : "بارگذاری"}
        </Button>
        {uploaded ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-danger"
            aria-label="حذف مدرک"
            disabled={working}
            onClick={() => onDelete(type)}
          >
            <Trash2Icon />
          </Button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          selectFile(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
    </div>
  );
}
