"use client";

import { BrandMark } from "@/components/layout/brand-mark";
import { FormContainer } from "@/components/shared";
import { APP_NAME, APP_SUBTITLE } from "@/lib/app";
import { LoginBrandPanel } from "./login-brand-panel";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-svh bg-background">
      <div className="flex w-full flex-col items-center justify-center px-6 py-10 lg:max-w-auth lg:w-full lg:px-10">
        <FormContainer variant="auth" className="flex flex-col gap-6">
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

          <LoginForm />

          {/* Dev-only entry point; remove when auth is built. */}
          {process.env.NODE_ENV !== "production" ? (
            <p className="text-center text-subtle text-muted-foreground">
              <a href="/coach" className="font-medium text-primary underline-offset-4 hover:underline">
                ورود به عنوان مربی (آزمایشی)
              </a>
            </p>
          ) : null}
        </FormContainer>
      </div>

      <LoginBrandPanel />
    </main>
  );
}
