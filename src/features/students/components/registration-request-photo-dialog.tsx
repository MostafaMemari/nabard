"use client";

import { ImageUpIcon, UploadIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field";
import { ACCEPTED_PROFILE_TYPES, compressProfileImage } from "@/lib/compress-image";
import { setRegistrationRequestPhoto } from "../api";
import type { RegistrationRequest } from "../types";

// Coach attaches or replaces the personal photo of a registration request;
// the province admin needs it before the request can be approved.
export function RegistrationRequestPhotoDialog({
  request,
  open,
  onOpenChange,
  onUploaded,
}: {
  request: RegistrationRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded: () => Promise<unknown>;
}) {
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
      setError("فقط تصاویر JPEG، PNG یا WebP پذیرفته می شوند");
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
        setError(compressError instanceof Error ? compressError.message : "تصویر قابل پردازش نیست");
      }
    })();
  }

  async function submit() {
    if (!file) {
      setError("عکس پرسنلی را انتخاب کنید");
      return;
    }

    setWorking(true);
    try {
      await setRegistrationRequestPhoto(request.id, file);
      await onUploaded();
      close();
    } catch (uploadError) {
      setWorking(false);
      setError(uploadError instanceof Error ? uploadError.message : "بارگذاری انجام نشد. دوباره تلاش کنید");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-md">
        <DialogHeader>
          <DialogTitle>عکس پرسنلی «{request.fullName}»</DialogTitle>
          <DialogDescription>عکس را برای بررسی ادمین استان بارگذاری کنید؛ بدون عکس، درخواست قابل تأیید نیست</DialogDescription>
        </DialogHeader>

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
          aria-label="انتخاب تصویر"
        >
          {preview ? (
            // biome-ignore lint/performance/noImgElement: local object url preview of the selected file
            <img src={preview} alt="پیش نمایش عکس" className="size-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageUpIcon aria-hidden className="size-6" />
              <span className="text-sm">انتخاب تصویر</span>
            </span>
          )}
        </button>
        {error ? <FieldError errors={[{ message: error }]} /> : null}
        <div className="flex items-center justify-between gap-3">
          <span className="text-subtle text-muted-foreground">JPEG، PNG یا WebP — حداکثر ۲ مگابایت</span>
          <Button type="button" onClick={() => void submit()} disabled={working || !file}>
            <UploadIcon data-icon="inline-start" />
            {working ? "در حال ارسال…" : "بارگذاری عکس"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
