"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { login, loginSchema } from "@/features/auth";
import { ApiError } from "@/lib/http";

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { mobile: "", password: "" },
  });

  async function handleSubmit(values: LoginFormValues) {
    setError(null);
    try {
      const user = await login(values);
      const home = user.role === "ADMIN" ? "/admin" : user.role === "SUPER_ADMIN" ? "/super" : "/coach";
      router.replace(home);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "ورود ناموفق بود. دوباره تلاش کنید.");
    }
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
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
        ورود
        <ArrowLeftIcon aria-hidden />
      </Button>
    </form>
  );
}
