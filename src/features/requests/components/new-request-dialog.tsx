"use client";

import { ArrowLeftRightIcon, ImageUpIcon, MapPinnedIcon, UserPlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMe } from "@/features/auth";
import { CoachPhotoChangeDialog } from "@/features/photo-changes";
import { ProvinceChangeRequestDialog } from "@/features/province-changes";
import { useStudents } from "@/features/students";
import { CoachChangeDialog } from "@/features/transfers";

type PickKind = "photo" | "coach" | "province";

const kindTitles: Record<PickKind, string> = { photo: "تغییر عکس", coach: "تغییر مربی", province: "تغییر استان" };

// One entry point for every request a coach can raise: the registration
// request opens its own page; photo, coach and province changes pick a
// student here and then hand over to the request dialog for that kind.
export function NewRequestDialog({
  open,
  onOpenChange,
  pendingPhotoIds,
  pendingCoachIds,
  pendingProvinceIds,
  onRequested,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingPhotoIds: ReadonlySet<string>;
  pendingCoachIds: ReadonlySet<string>;
  pendingProvinceIds: ReadonlySet<string>;
  onRequested: () => void;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<PickKind | null>(null);
  const [studentId, setStudentId] = useState("");
  // The delegated dialog currently open — it keeps its own student so the
  // picker can reset while it shows.
  const [target, setTarget] = useState<{ kind: PickKind; studentId: string } | null>(null);

  const { students } = useStudents({ pageSize: 100 });
  const { user } = useMe();
  const student = students.find((item) => item.id === studentId);
  const targetStudent = students.find((item) => item.id === target?.studentId);

  const pendingFor = (pickKind: PickKind): boolean => {
    if (!student) return false;
    const sets = { photo: pendingPhotoIds, coach: pendingCoachIds, province: pendingProvinceIds } as const;
    return sets[pickKind].has(student.id);
  };
  const blocked = kind ? pendingFor(kind) : false;

  function close() {
    setKind(null);
    setStudentId("");
    setTarget(null);
    onOpenChange(false);
  }

  function finish() {
    if (!kind || !student) return;
    setTarget({ kind, studentId: student.id });
    setKind(null);
    setStudentId("");
    onOpenChange(false);
  }

  return (
    <>
      <Dialog
        open={open && target === null}
        onOpenChange={(next) => {
          if (!next) {
            close();
          }
        }}
      >
        <DialogContent showCloseButton className="max-w-md">
          <DialogHeader>
            <DialogTitle>ثبت درخواست جدید</DialogTitle>
            <DialogDescription>
              {kind
                ? `هنرجو را برای «${kindTitles[kind]}» انتخاب کنید`
                : "نوع درخواست را انتخاب کنید؛ درخواست ها با تأیید ادمین استان نهایی می شوند"}
            </DialogDescription>
          </DialogHeader>

          {kind === null ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  close();
                  router.push("/coach/students/new");
                }}
                className="flex flex-col items-start gap-1.5 rounded-xl border border-border bg-card p-4 text-start shadow-card transition-colors hover:border-primary/60"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <UserPlusIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                  ثبت هنرجو
                </span>
                <span className="text-subtle text-muted-foreground">فرم ثبت هنرجوی جدید</span>
              </button>
              <button
                type="button"
                onClick={() => setKind("photo")}
                className="flex flex-col items-start gap-1.5 rounded-xl border border-border bg-card p-4 text-start shadow-card transition-colors hover:border-primary/60"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <ImageUpIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                  تغییر عکس
                </span>
                <span className="text-subtle text-muted-foreground">عکس جدید یکی از هنرجوها</span>
              </button>
              <button
                type="button"
                onClick={() => setKind("coach")}
                className="flex flex-col items-start gap-1.5 rounded-xl border border-border bg-card p-4 text-start shadow-card transition-colors hover:border-primary/60"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <ArrowLeftRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                  تغییر مربی
                </span>
                <span className="text-subtle text-muted-foreground">انتقال به مربی دیگر استان</span>
              </button>
              <button
                type="button"
                onClick={() => setKind("province")}
                className="flex flex-col items-start gap-1.5 rounded-xl border border-border bg-card p-4 text-start shadow-card transition-colors hover:border-primary/60"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <MapPinnedIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                  تغییر استان
                </span>
                <span className="text-subtle text-muted-foreground">انتقال به مربی استان دیگر</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {students.length === 0 ? (
                <p className="text-subtle rounded-lg bg-warning-bg px-3 py-2.5 text-warning">
                  هنرجوی تأیید شده ای ندارید؛ ابتدا از «ثبت هنرجو» درخواست ثبت دهید
                </p>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium">هنرجو</span>
                    <Select value={studentId} onValueChange={(value) => setStudentId(value ?? "")}>
                      <SelectTrigger aria-label="انتخاب هنرجو" className="w-full">
                        <SelectValue placeholder="انتخاب هنرجو" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {student && blocked ? (
                    <p className="text-subtle rounded-lg bg-warning-bg px-3 py-2.5 text-warning">
                      برای «{student.fullName}» درخواست {kindTitles[kind]} در انتظار بررسی وجود دارد؛ تا نتیجه آن، درخواست جدید ثبت نمی شود
                    </p>
                  ) : null}
                  <p className="text-subtle text-muted-foreground">
                    {kind === "photo"
                      ? "عکس جدید در گام بعد انتخاب می شود و با تأیید ادمین استان جایگزین می شود"
                      : kind === "coach"
                        ? "مربی مقصد در گام بعد انتخاب می شود؛ جنسیت مربی و هنرجو باید یکسان باشد"
                        : "استان و مربی مقصد در گام بعد انتخاب می شوند و ادمین استان مقصد تأیید می کند"}
                  </p>
                </>
              )}
              <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setKind(null)}>
                  بازگشت
                </Button>
                <Button type="button" onClick={finish} disabled={!student || blocked}>
                  ادامه
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {targetStudent && target ? (
        <>
          <CoachPhotoChangeDialog
            studentId={targetStudent.id}
            studentName={targetStudent.fullName}
            open={target.kind === "photo"}
            hasPending={pendingPhotoIds.has(targetStudent.id)}
            onOpenChange={(next) => {
              if (!next) {
                close();
                onRequested();
              }
            }}
            onRequested={onRequested}
          />
          <CoachChangeDialog
            studentId={targetStudent.id}
            studentName={targetStudent.fullName}
            open={target.kind === "coach"}
            hasPending={pendingCoachIds.has(targetStudent.id)}
            onOpenChange={(next) => {
              if (!next) {
                close();
                onRequested();
              }
            }}
            onRequested={onRequested}
          />
          <ProvinceChangeRequestDialog
            studentId={targetStudent.id}
            studentName={targetStudent.fullName}
            currentProvince={user?.province ?? null}
            open={target.kind === "province"}
            hasPending={pendingProvinceIds.has(targetStudent.id) || pendingCoachIds.has(targetStudent.id)}
            onOpenChange={(next) => {
              if (!next) {
                close();
                onRequested();
              }
            }}
            onRequested={onRequested}
          />
        </>
      ) : null}
    </>
  );
}
