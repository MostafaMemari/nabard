"use client";

import { CircleUserIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Avatar } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ChangePasswordButton } from "@/features/auth";
import type { SidebarUser } from "./app-sidebar";
import { LogoutButton } from "./logout-button";

// Bottom sheet behind the mobile header avatar: shows who is signed in and
// keeps the account actions in one place instead of crowding the top bar.
export function MobileUserSheet({ user, extra }: { user: SidebarUser | null; extra?: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="حساب کاربری"
        title="حساب کاربری"
        className="rounded-full"
        onClick={() => setOpen(true)}
      >
        {user ? <Avatar id={user.id} name={user.name} size="sm" /> : <CircleUserIcon aria-hidden className="size-4.5" />}
      </Button>
      <SheetContent side="bottom" className="mx-auto max-w-content rounded-t-2xl" aria-label="حساب کاربری">
        <div className="flex items-center gap-3 border-b border-border px-5 pb-4">
          {user ? (
            <>
              <Avatar id={user.id} name={user.name} size="lg" />
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-base font-semibold">{user.name}</span>
                <span className="mt-1 text-subtle text-muted-foreground">{user.roleLabel}</span>
              </div>
            </>
          ) : (
            <>
              <span aria-hidden className="size-10 rounded-full bg-muted" />
              <span className="flex flex-col gap-1.5">
                <span className="h-3.5 w-24 rounded bg-muted" />
                <span className="h-2.5 w-14 rounded bg-muted" />
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 px-5 pb-6">
          {user ? (
            <>
              {extra}
              <ChangePasswordButton className="size-9 rounded-lg" />
              <LogoutButton className="size-9 rounded-lg" />
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
