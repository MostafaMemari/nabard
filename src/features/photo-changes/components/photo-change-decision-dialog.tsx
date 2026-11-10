"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { DownloadIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { photoChangeFileUrl } from "../api";
import { usePhotoChangeDecision } from "../hooks/use-photo-changes";
import { type RejectPhotoChangeValues, rejectPhotoChangeSchema } from "../schemas";
import type { PhotoChangeRequest } from "../types";

function PhotoBox({ label, src }: { label: string; src: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <span className="text-subtle text-muted-foreground">{label}</span>
      {/* biome-ignore lint/performance/noImgElement: authenticated session-cookie url, not a static import */}
      <img src={src} alt={label} className="size-28 rounded-xl border border-border object-cover" />
    </div>
  );
}

export function PhotoChangeDecisionDialog({
  request,
  decision,
  onClose,
  onDecided,
}: {
  request: PhotoChangeRequest | null;
  decision: "approve" | "reject";
  onClose: () => void;
  onDecided: () => void;
}) {
  const { decide } = usePhotoChangeDecision(onDecided);
  const form = useForm<RejectPhotoChangeValues, unknown, RejectPhotoChangeValues>({
    resolver: zodResolver(rejectPhotoChangeSchema),
    defaultValues: { note: "" },
  });
  const approving = decision === "approve";

  function close() {
    form.reset({ note: "" });
    onClose();
  }

  async function submit(values: RejectPhotoChangeValues) {
    if (!request) return;

    const done = await decide(request.id, decision, values.note?.trim());
    if (done) {
      close();
    }
  }

  async function approve() {
    if (!request) return;

    const done = await decide(request.id, "approve");
    if (done) {
      close();
    }
  }

  return (
    <Dialog
      open={request !== null}
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
    >
      <DialogContent showCloseButton={false} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{approving ? "تأیید تغییر عکس هنرجو" : "رد درخواست تغییر عکس"}</DialogTitle>
          <DialogDescription>
            {approving
              ? `عکس جدید جایگزین عکس پروفایل «${request?.studentName ?? ""}» می شود.`
              : `درخواست تغییر عکس «${request?.studentName ?? ""}» رد می شود.`}
          </DialogDescription>
        </DialogHeader>
        {approving ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-center gap-4 rounded-xl border border-border px-3 py-4">
              {request?.hasCurrentPhoto ? (
                <PhotoBox label="عکس فعلی" src={`/api/v1/students/${request.studentId}/documents/PHOTO/file`} />
              ) : null}
              {request ? <PhotoBox label="عکس جدید" src={photoChangeFileUrl(request.id)} /> : null}
            </div>
            <a
              href={request ? photoChangeFileUrl(request.id, true) : "#"}
              download
              className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted/50"
            >
              <DownloadIcon aria-hidden className="size-4" />
              دانلود عکس جدید
            </a>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                انصراف
              </Button>
              <Button type="button" onClick={() => void approve()}>
                تأیید و جایگزینی عکس
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
            <Field data-invalid={form.formState.errors.note ? "" : undefined}>
              <FieldLabel htmlFor="photo-change-note">دلیل رد درخواست</FieldLabel>
              <Textarea
                id="photo-change-note"
                rows={3}
                placeholder="مثلاً کیفیت عکس مناسب نیست؛ عکس پرسنلی واضح بارگذاری کنید."
                {...form.register("note")}
              />
              {form.formState.errors.note ? <FieldError errors={[form.formState.errors.note]} /> : null}
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                انصراف
              </Button>
              <Button type="submit" variant="destructive" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "در حال ثبت…" : "رد درخواست"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
