"use client";

import { Trash2Icon, UploadIcon } from "lucide-react";
import { IconTile } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import { useReceiptFile } from "../hooks/use-receipt-file";

export function ReceiptUploadField({ file, onChange }: { file: File | null; onChange: (file: File | null) => void }) {
  const { inputRef, previewUrl, error, compressing, selectFile, clear } = useReceiptFile({ file, onChange });

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => void selectFile(event.target.files?.[0] ?? null)}
      />
      {file && previewUrl ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border p-3">
          {/* biome-ignore lint/performance/noImgElement: preview of a locally selected file blob */}
          <img
            src={previewUrl}
            alt={`پیش نمایش رسید ${file.name}`}
            width={640}
            height={360}
            className="h-48 w-full rounded-lg object-cover"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-subtle min-w-0 truncate text-muted-foreground">
              {file.name} · {formatNumber(Math.round(file.size / 1024))} کیلوبایت
            </span>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="حذف تصویر رسید" onClick={clear}>
              <Trash2Icon />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-32 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground transition-colors duration-150 hover:border-primary hover:text-primary"
        >
          <IconTile icon={UploadIcon} />
          <span className="flex flex-col items-center gap-1">
            <span>{compressing ? "در حال فشرده سازی تصویر…" : "انتخاب تصویر رسید"}</span>
            <span className="text-subtle text-muted-foreground">تصویر به صورت خودکار فشرده می شود</span>
          </span>
        </button>
      )}
      {error ? <p className="text-subtle text-danger">{error}</p> : null}
    </div>
  );
}
