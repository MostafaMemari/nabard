"use client";

import { CircleUserIcon, KeyRoundIcon, LogOutIcon, MapPinIcon } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChangePasswordDialog, useLogout } from "@/features/auth";
import { CoachProfileDialog } from "@/features/county-changes";
import type { SidebarUser } from "./app-sidebar";

// Dropdown behind the mobile header avatar: shows who is signed in and keeps
// the account actions one tap away at the top of the screen.
export function MobileUserMenu({ user, coachProfile = false }: { user: SidebarUser | null; coachProfile?: boolean }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const signOut = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button type="button" variant="ghost" size="icon-sm" aria-label="حساب کاربری" title="حساب کاربری" className="rounded-full">
            {user ? <Avatar id={user.id} name={user.name} size="sm" /> : <CircleUserIcon aria-hidden className="size-4.5" />}
          </Button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        {user ? (
          <>
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <Avatar id={user.id} name={user.name} size="md" />
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-sm font-semibold">{user.name}</span>
                <span className="mt-0.5 text-xs text-muted-foreground">{user.roleLabel}</span>
              </div>
            </div>
            <DropdownMenuSeparator />
            {coachProfile ? (
              <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                <MapPinIcon aria-hidden />
                پروفایل مربی
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={() => setPasswordOpen(true)}>
              <KeyRoundIcon aria-hidden />
              تغییر رمز عبور
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => void signOut()}>
              <LogOutIcon aria-hidden />
              خروج از حساب
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
      {coachProfile ? <CoachProfileDialog open={profileOpen} onOpenChange={setProfileOpen} /> : null}
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </DropdownMenu>
  );
}
