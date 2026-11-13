"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

const descriptionSchema = z.object({
  description: z.string().trim().max(2000, "توضیحات حداکثر ۲۰۰۰ نویسه است"),
});

type DescriptionFormValues = z.output<typeof descriptionSchema>;

export function CompetitionDescriptionDialog({
  open,
  onOpenChange,
  initialValue,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue: string;
  loading: boolean;
  onConfirm: (description: string) => Promise<void>;
}) {
  const form = useForm<DescriptionFormValues, unknown, DescriptionFormValues>({
    resolver: zodResolver(descriptionSchema),
    defaultValues: { description: initialValue },
  });

  async function submit(values: DescriptionFormValues) {
    await onConfirm(values.description);
    form.reset({ description: values.description });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          form.reset({ description: initialValue });
        }
        onOpenChange(next);
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>توضیحات مسابقه</DialogTitle>
          <DialogDescription>این توضیحات برای مربی ها نمایش داده می شود؛ مثلاً آدرس سالن، برنامه روز مسابقه یا مدارک لازم</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
          <Field data-invalid={form.formState.errors.description ? "" : undefined}>
            <FieldLabel htmlFor="competition-description">متن توضیحات (اختیاری)</FieldLabel>
            <Textarea
              id="competition-description"
              rows={5}
              placeholder="مثلاً سالن اختصاصی مجموعه های ورزشی انقلاب، ساعت ۸ صبح حضور داشته باشید"
              {...form.register("description")}
            />
            {form.formState.errors.description ? <FieldError errors={[form.formState.errors.description]} /> : null}
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting || loading}>
              ذخیره توضیحات
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
