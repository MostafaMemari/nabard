"use client";

import { KeyRoundIcon, LogOutIcon, MapPinIcon } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/shared";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ChangePasswordDialog, useLogout } from "@/features/auth";
import { CoachProfileDialog } from "@/features/county-changes";
import type { SidebarUser } from "./app-sidebar";
import { SheetHandle } from "./sheet-handle";

const rowClass =
  "flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

// Mobile account menu: the top bar avatar opens its own sheet with the account
// actions, separate from the workspace sheet.
export function MobileAccountMenu({ user, coachProfile = false }: { user: SidebarUser | null; coachProfile?: boolean }) {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const signOut = useLogout();

  if (!user) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label="حساب کاربری"
        onClick={() => setOpen(true)}
        className="rounded-full transition-opacity duration-150 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Avatar id={user.id} name={user.name} size="md" src={user.photoUrl} />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" showCloseButton={false} className="mx-auto max-w-content gap-0 rounded-t-2xl p-0">
          <SheetTitle className="sr-only">حساب کاربری</SheetTitle>
          <SheetHandle onClose={() => setOpen(false)} />
          <div className="flex items-center gap-3 px-4 pb-3">
            <Avatar id={user.id} name={user.name} size="lg" src={user.photoUrl} />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-semibold">{user.name}</span>
              <span className="mt-0.5 truncate text-xs text-muted-foreground">{user.roleLabel}</span>
            </span>
          </div>
          <ul className="flex flex-col gap-0.5 border-t border-border px-2 pt-2">
            {coachProfile ? (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setProfileOpen(true);
                  }}
                  className={rowClass}
                >
                  <MapPinIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                  پروفایل و شهرستان
                </button>
              </li>
            ) : null}
            <li>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setPasswordOpen(true);
                }}
                className={rowClass}
              >
                <KeyRoundIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                تغییر رمز عبور
              </button>
            </li>
            <li className="my-1 h-px bg-border" aria-hidden />
            <li className="pb-2">
              <button
                type="button"
                onClick={() => void signOut()}
                className={`${rowClass} text-destructive hover:bg-destructive/10`}
                style={{ marginBottom: "env(safe-area-inset-bottom)" }}
              >
                <LogOutIcon aria-hidden className="size-4 shrink-0" />
                خروج از حساب
              </button>
            </li>
          </ul>
        </SheetContent>
      </Sheet>
      {coachProfile ? <CoachProfileDialog open={profileOpen} onOpenChange={setProfileOpen} /> : null}
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </>
  );
}
