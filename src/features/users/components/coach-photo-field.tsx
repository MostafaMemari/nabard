"use client";

import { Trash2Icon, UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Avatar } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ACCEPTED_RECEIPT_TYPES } from "@/features/registrations";
import { useCoachPhoto } from "../hooks/use-coach-photo";

export function CoachPhotoField({
  userId,
  fullName,
  hasPhoto,
  photoUrl,
}: {
  userId: string;
  fullName: string;
  hasPhoto: boolean;
  photoUrl?: string | null;
}) {
  const { working, upload, remove } = useCoachPhoto();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function selectFile(file: File | null) {
    if (!file) return;

    if (!ACCEPTED_RECEIPT_TYPES.has(file.type)) {
      setError("فقط تصاویر JPEG، PNG یا WebP پذیرفته می شوند.");
      return;
    }

    setError(null);
    void upload(file);
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar id={userId} name={fullName} size="lg" src={photoUrl ?? undefined} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" disabled={working} onClick={() => inputRef.current?.click()}>
            <UploadIcon data-icon="inline-start" />
            {working ? "در حال ذخیره…" : hasPhoto ? "تغییر عکس" : "بارگذاری عکس"}
          </Button>
          {hasPhoto ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="text-danger"
              aria-label="حذف عکس"
              disabled={working}
              onClick={() => void remove()}
            >
              <Trash2Icon />
            </Button>
          ) : null}
        </div>
        {error ? (
          <p className="text-subtle text-danger">{error}</p>
        ) : (
          <p className="text-subtle text-muted-foreground">JPEG، PNG یا WebP تا ۲ مگابایت.</p>
        )}
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
