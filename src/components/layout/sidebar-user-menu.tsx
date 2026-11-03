"use client";

import { ChevronUpIcon, KeyRoundIcon, LogOutIcon, MapPinIcon } from "lucide-react";
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

// Fixed footer of the sidebar: one full-width button that opens the account
// menu above it, anchored to the same width as the trigger.
export function SidebarUserMenu({ user, coachProfile = false }: { user: SidebarUser | null; coachProfile?: boolean }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const signOut = useLogout();

  if (!user) {
    return (
      <div aria-hidden className="flex items-center gap-3 rounded-lg p-3">
        <span className="size-9 shrink-0 rounded-full bg-sidebar-accent" />
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="h-3 w-24 rounded bg-sidebar-accent" />
          <span className="h-2.5 w-14 rounded bg-sidebar-accent" />
        </span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            className="h-auto w-full justify-start gap-3 rounded-lg p-3 text-start hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground aria-expanded:bg-sidebar-accent"
          >
            <Avatar id={user.id} name={user.name} size="md" />
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-sm font-medium text-sidebar-accent-foreground">{user.name}</span>
              <span className="mt-0.5 truncate text-xs text-sidebar-foreground/80">{user.roleLabel}</span>
            </span>
            <ChevronUpIcon aria-hidden className="size-4 shrink-0 text-sidebar-foreground/70" />
          </Button>
        }
      />
      <DropdownMenuContent side="top" align="start" sideOffset={8}>
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar id={user.id} name={user.name} size="md" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold">{user.name}</span>
            <span className="mt-0.5 truncate text-xs text-muted-foreground">{user.roleLabel}</span>
          </span>
        </div>
        <DropdownMenuSeparator />
        {coachProfile ? (
          <DropdownMenuItem onClick={() => setProfileOpen(true)}>
            <MapPinIcon aria-hidden />
            پروفایل و شهرستان
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onClick={() => setPasswordOpen(true)}>
          <KeyRoundIcon aria-hidden />
          تغییر رمز عبور
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => void signOut()}>
          <LogOutIcon aria-hidden />
          خروج از حساب
        </DropdownMenuItem>
      </DropdownMenuContent>
      {coachProfile ? <CoachProfileDialog open={profileOpen} onOpenChange={setProfileOpen} /> : null}
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </DropdownMenu>
  );
}
