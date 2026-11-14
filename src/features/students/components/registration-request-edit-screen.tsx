"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DetailPageHeader, ErrorBanner, FormActions, FormContainer, PageHeader, SkeletonRows, StateCard } from "@/components/shared";
import { useBelts } from "@/features/base-data";
import { updateRegistrationRequest } from "../api";
import { useRegistrationRequest } from "../hooks/use-registration-request";
import { emptyStudentForm, type StudentFormValues, studentSchema } from "../schemas";
import type { RegistrationRequestDetail } from "../types";
import { StudentRegistrationFields } from "./student-registration-fields";

// The coach corrects a rejected (or pending) registration request on its own
// page — same form as the registration page; saving resubmits it for review.
function RequestEditForm({ request, belts }: { request: RegistrationRequestDetail; belts: ReturnType<typeof useBelts>["belts"] }) {
  const router = useRouter();
  const form = useForm<StudentFormValues, unknown, StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      ...emptyStudentForm,
      fullName: request.fullName,
      nationalCode: request.nationalCode,
      birthDate: request.birthDate,
      mobile: request.mobile ?? "",
      beltId: request.beltId,
      beltCertificateDate: request.beltCertificateDate ?? "",
      insuranceDate: request.insuranceDate ?? "",
      tkdBankChargeYear: request.tkdBankChargeYear !== null ? String(request.tkdBankChargeYear) : "",
    },
  });

  async function submit(values: StudentFormValues) {
    try {
      await updateRegistrationRequest(request.id, {
        fullName: values.fullName.trim(),
        nationalCode: values.nationalCode,
        birthDate: values.birthDate,
        mobile: values.mobile,
        beltId: values.beltId,
        beltCertificateDate: values.beltCertificateDate,
        insuranceDate: values.insuranceDate,
        tkdBankChargeYear: values.tkdBankChargeYear,
      });
      toast.success("درخواست اصلاح شد و دوباره برای بررسی به ادمین استان ارسال شد");
      router.push("/coach/requests");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره انجام نشد. دوباره تلاش کنید");
    }
  }

  return (
    <FormContainer variant="student">
      <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-6">
        <PageHeader
          title="ویرایش درخواست ثبت هنرجو"
          description={`اصلاح اطلاعات «${request.fullName}» و ارسال مجدد برای بررسی ادمین استان`}
        />

        <StudentRegistrationFields form={form} belts={belts} />

        {request.status === "REJECTED" && request.reviewNote ? (
          <p className="flex items-start gap-2 rounded-xl border border-border bg-warning-bg px-3 py-2.5 text-subtle text-warning">
            دلیل رد ادمین استان: {request.reviewNote}
          </p>
        ) : null}

        <FormActions cancelHref="/coach/requests" submitLabel="ذخیره و ارسال مجدد" submitting={form.formState.isSubmitting} />
      </form>
    </FormContainer>
  );
}

export function RegistrationRequestEditScreen({ requestId }: { requestId: string }) {
  const { request, isLoading, error, mutate } = useRegistrationRequest(requestId);
  const { belts } = useBelts();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <SkeletonRows rows={1} className="h-8" />
        <SkeletonRows rows={6} />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex flex-col gap-4">
        <DetailPageHeader backHref="/coach/requests" backLabel="درخواست ها" title="ویرایش درخواست" />
        <ErrorBanner message="این درخواست پیدا نشد" onRetry={() => mutate()} />
      </div>
    );
  }

  if (request.status === "APPROVED") {
    return (
      <div className="flex flex-col gap-4">
        <DetailPageHeader backHref="/coach/requests" backLabel="درخواست ها" title="ویرایش درخواست" />
        <StateCard className="flex flex-col gap-2 p-5">
          <span className="text-sm font-medium">این درخواست تأیید شده و قابل ویرایش نیست</span>
          <p className="text-subtle text-muted-foreground">اطلاعات هنرجوی تأیید شده در صفحه هنرجو مدیریت می شود</p>
          <Link
            href="/coach/students"
            className="inline-flex w-fit items-center gap-1 text-subtle font-medium text-primary underline-offset-4 hover:underline"
          >
            <ChevronRightIcon aria-hidden className="size-4" />
            مشاهده هنرجویان
          </Link>
        </StateCard>
      </div>
    );
  }

  return <RequestEditForm key={request.id} request={request} belts={belts} />;
}
