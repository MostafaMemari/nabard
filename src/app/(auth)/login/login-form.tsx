"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { demoAccounts } from "@/lib/demo";

const toLatinDigits = (value: string) =>
  value.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

const loginSchema = z.object({
  mobile: z
    .string()
    .transform((value) => toLatinDigits(value).trim())
    .pipe(z.string().regex(/^09\d{9}$/, "شماره همراه باید ۱۱ رقم باشد و با ۰۹ شروع شود.")),
  password: z
    .string()
    .transform((value) => toLatinDigits(value).trim())
    .pipe(z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد.")),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { mobile: "", password: "" },
  });

  function handleSubmit(values: LoginFormValues) {
    const account = demoAccounts.find((item) => item.mobile === values.mobile);
    if (!account || account.password !== values.password) {
      form.setError("mobile", { message: "شماره همراه یا رمز عبور نادرست است." });
      return;
    }
    router.push(account.home);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void form.handleSubmit(handleSubmit)(event);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <Controller
        name="mobile"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid ? "" : undefined}>
            <FieldLabel htmlFor="mobile">شماره همراه</FieldLabel>
            <Input
              id="mobile"
              type="tel"
              inputMode="numeric"
              autoComplete="username"
              spellCheck={false}
              dir="ltr"
              className="h-11 lg:h-10"
              placeholder="۰۹۱۲۱۲۳۴۵۶۷"
              {...field}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name="password"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid ? "" : undefined}>
            <FieldLabel htmlFor="password">رمز عبور</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              dir="ltr"
              className="h-11 lg:h-10"
              placeholder="••••••••"
              {...field}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Button type="submit" size="lg" className="w-full">
        ورود
        <ArrowLeftIcon aria-hidden />
      </Button>

      <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3">
        <p className="text-xs font-medium text-muted-foreground">حساب‌های آزمایشی (برای پر کردن خودکار بزنید):</p>
        {demoAccounts.map((account) => (
          <button
            key={account.id}
            type="button"
            onClick={() => {
              form.setValue("mobile", account.mobile);
              form.setValue("password", account.password);
              form.clearErrors();
              void form.handleSubmit(handleSubmit)();
            }}
            className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-start text-xs transition-colors hover:bg-accent"
          >
            <span className="shrink-0 font-medium">{account.roleLabel}</span>
            <span dir="ltr" className="font-mono text-[11px] text-muted-foreground">
              {account.mobile} / {account.password}
            </span>
          </button>
        ))}
      </div>
    </form>
  );
}
