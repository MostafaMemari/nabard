"use client";

import { ImageUpIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field";
import { ACCEPTED_PROFILE_TYPES, compressProfileImage } from "@/lib/compress-image";
import { useStudentPhotoChangeRequest } from "../hooks/use-photo-changes";

// Coach picks a replacement photo for their student. The image is previewed
// and compressed in the browser, then attached to a review request — it does
// NOT touch the profile photo until the province admin approves.
export function CoachPhotoChangeDialog({
  studentId,
  studentName,
  open,
  hasPending,
  onOpenChange,
  onRequested,
}: {
  studentId: string;
  studentName: string;
  open: boolean;
  hasPending: boolean;
  onOpenChange: (open: boolean) => void;
  onRequested: () => void;
}) {
  const { request } = useStudentPhotoChangeRequest(onRequested);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function close() {
    setFile(null);
    setPreview(null);
    setError(null);
    setWorking(false);
    onOpenChange(false);
  }

  function selectFile(selected: File | null) {
    if (!selected) return;

    if (!ACCEPTED_PROFILE_TYPES.has(selected.type)) {
      setError("فقط تصاویر JPEG، PNG یا WebP پذیرفته می شوند.");
      return;
    }

    setError(null);
    void (async () => {
      try {
        const compressed = await compressProfileImage(selected);
        if (preview) URL.revokeObjectURL(preview);
        setFile(compressed);
        setPreview(URL.createObjectURL(compressed));
      } catch (compressError) {
        setError(compressError instanceof Error ? compressError.message : "تصویر قابل پردازش نیست.");
      }
    })();
  }

  function clearFile() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function submit() {
    if (!file) {
      setError("تصویر جدید را انتخاب کنید.");
      return;
    }

    setWorking(true);
    const done = await request(studentId, file);
    setWorking(false);
    if (done) {
      close();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          close();
        }
      }}
    >
      <DialogContent showCloseButton={false} className="max-w-md">
        <DialogHeader>
          <DialogTitle>درخواست تغییر عکس «{studentName}»</DialogTitle>
          <DialogDescription>
            عکس جدید را انتخاب کنید تا برای بررسی به ادمین استان ارسال شود؛ عکس پروفایل فقط پس از تأیید ادمین جایگزین می شود.
          </DialogDescription>
        </DialogHeader>

        {hasPending ? (
          <p className="text-subtle rounded-lg bg-warning-bg px-3 py-2.5 text-warning">
            یک درخواست تغییر عکس برای این هنرجو در انتظار بررسی است؛ تا نتیجه آن، درخواست جدید ثبت نمی شود.
          </p>
        ) : (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="relative mx-auto flex aspect-[4/3] w-full max-w-60 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/40 transition hover:border-primary/60"
              aria-label="انتخاب تصویر جدید"
            >
              {preview ? (
                // biome-ignore lint/performance/noImgElement: local object url preview of the selected file
                <img src={preview} alt="پیش نمایش عکس جدید" className="size-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageUpIcon aria-hidden className="size-6" />
                  <span className="text-sm">انتخاب تصویر</span>
                </span>
              )}
            </button>
            {error ? <FieldError errors={[{ message: error }]} /> : null}
            <div className="flex items-center justify-between gap-3">
              {file ? (
                <Button type="button" variant="ghost" className="text-danger hover:text-danger" onClick={clearFile}>
                  <Trash2Icon data-icon="inline-start" />
                  حذف تصویر
                </Button>
              ) : (
                <span className="text-subtle text-muted-foreground">JPEG، PNG یا WebP — حداکثر ۲ مگابایت</span>
              )}
              <Button type="button" onClick={() => void submit()} disabled={working || !file}>
                <UploadIcon data-icon="inline-start" />
                {working ? "در حال ارسال…" : "ثبت درخواست"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
