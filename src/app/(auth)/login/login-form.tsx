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

const loginSchema = z.object({
  mobile: z
    .string()
    .transform((value) => value.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))))
    .pipe(z.string().regex(/^09\d{9}$/, "شماره همراه باید ۱۱ رقم باشد و با ۰۹ شروع شود.")),
  password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { mobile: "", password: "" },
  });

  function handleSubmit(_values: LoginFormValues) {
    router.push("/admin");
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
            <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" {...field} />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Button type="submit" size="lg" className="w-full">
        ورود
        <ArrowLeftIcon aria-hidden />
      </Button>
    </form>
  );
}
