"use client";
import { FileSpreadsheetIcon, TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toPersianDigits } from "@/lib/format";
import { useStudentImport } from "../hooks/use-student-import";

export function StudentImportDialog({
  open,
  onOpenChange,
  coachId,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coachId?: string;
  onImported: () => void;
}) {
  const { file, setFile, working, error, rowErrors, close, submit } = useStudentImport({ coachId, onOpenChange, onImported });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent showCloseButton={false} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>وارد کردن گروهی هنرجو با اکسل</DialogTitle>
          <DialogDescription>
            فایل قالب را پر کنید و بارگذاری کنید؛ برای هر هنرجو یک ردیف وارد می شود و درخواست ثبت برای بررسی به ادمین استان ارسال می شود
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
          noValidate
          className="flex flex-col gap-4"
        >
          <a
            href="/api/v1/students/import-template"
            download
            className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <FileSpreadsheetIcon aria-hidden className="size-4 shrink-0" />
            دانلود قالب اکسل هنرجویان
          </a>

          <p className="text-subtle text-muted-foreground">
            ستون ها: نام و نام خانوادگی، کد ملی، تلفن همراه، تاریخ تولد، کمربند، تاریخ حکم کمربند (اختیاری)، تاریخ بیمه ورزشی (اختیاری) و
            سال شارژ بانک تکواندو (اختیاری) فقط سال است، مثل ۱۴۰۰. کمربند باید دقیقاً یکی از کمربندهای سامانه باشد؛ اگر حتی یک ردیف خطا داشته
            باشد، هیچ هنرجویی ثبت نمی شود
          </p>

          <Field data-invalid={error || rowErrors.length > 0 ? "" : undefined}>
            <FieldLabel htmlFor="student-import-file">فایل اکسل (xlsx)</FieldLabel>
            <Input id="student-import-file" type="file" accept=".xlsx" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            {error ? <FieldError errors={[{ message: error }]} /> : null}
          </Field>

          {rowErrors.length > 0 ? (
            <div className="flex max-h-44 flex-col gap-1.5 overflow-y-auto rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-danger">
              {rowErrors.map((item) => (
                <p key={`${item.row}-${item.message}`} className="flex items-start gap-2">
                  <TriangleAlertIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
                  <span>
                    ردیف {toPersianDigits(item.row)}: {item.message}
                  </span>
                </p>
              ))}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={close}>
              انصراف
            </Button>
            <Button type="submit" disabled={working || file === null}>
              {working ? "در حال بارگذاری…" : "ثبت هنرجویان"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
