"use client";

import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { APP_NAME, APP_SUBTITLE } from "@/lib/app";

function TatamiPattern() {
  return (
    <svg aria-hidden className="absolute inset-0 size-full" role="presentation">
      <defs>
        <pattern id="tatami-grid" width="96" height="48" patternUnits="userSpaceOnUse">
          <rect x="0.5" y="0.5" width="95" height="47" rx="2" fill="none" stroke="white" strokeOpacity="0.05" />
          <line x1="48" y1="0" x2="48" y2="48" stroke="white" strokeOpacity="0.05" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#tatami-grid)" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/");
  }

  return (
    <main className="flex min-h-svh bg-background">
      <div className="flex w-full flex-col items-center justify-center px-6 py-10 lg:w-[440px] lg:px-10">
        <div className="flex w-full max-w-[380px] flex-col gap-6">
          <div className="flex flex-col items-center gap-3 text-center lg:hidden">
            <BrandMark className="size-10 rounded-xl" />
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold">{APP_NAME}</h1>
              <p className="text-subtle text-muted-foreground">{APP_SUBTITLE}</p>
            </div>
          </div>

          <div className="hidden flex-col gap-1 lg:flex">
            <h1 className="text-2xl font-semibold">ورود به {APP_NAME}</h1>
            <p className="text-subtle text-muted-foreground">{APP_SUBTITLE}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Field>
              <FieldLabel htmlFor="mobile">شماره همراه</FieldLabel>
              <Input id="mobile" name="mobile" type="tel" inputMode="numeric" autoComplete="username" placeholder="۰۹۱۲۱۲۳۴۵۶۷" />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">رمز عبور</FieldLabel>
              <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" />
            </Field>
            <Button type="submit" size="lg" className="w-full">
              ورود
              <ArrowLeftIcon aria-hidden />
            </Button>
          </form>

          {process.env.NODE_ENV !== "production" ? (
            <p className="text-center text-subtle text-muted-foreground">
              حالت توسعه:{" "}
              <a href="/dev/ui" className="font-medium text-primary underline-offset-4 hover:underline">
                ورود آزمایشی به عنوان مربی
              </a>
            </p>
          ) : null}
        </div>
      </div>

      <div className="login-brand-panel relative hidden flex-1 overflow-hidden lg:block">
        <TatamiPattern />
        <div className="absolute inset-x-10 bottom-10 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <BrandMark className="size-10 rounded-xl" />
            <span className="text-3xl font-semibold text-white">{APP_NAME}</span>
          </div>
          <p className="text-sm text-sidebar-foreground">{APP_SUBTITLE}</p>
        </div>
      </div>
    </main>
  );
}
