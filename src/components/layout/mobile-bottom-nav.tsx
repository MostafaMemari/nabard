"use client";

import { cn } from "cn";
import { KeyRoundIcon, LogOutIcon, MapPinIcon, MenuIcon } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Avatar } from "@/components/shared";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ChangePasswordDialog, useLogout } from "@/features/auth";
import { CoachProfileDialog } from "@/features/county-changes";
import type { SidebarNavItem, SidebarUser } from "./app-sidebar";

function BottomNavItem({ item, active }: { item: SidebarNavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-w-16 flex-1 basis-0 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-150",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span className={cn("flex h-6 w-10 items-center justify-center rounded-full", active && "bg-primary-subtle")}>
        <item.icon aria-hidden className="size-5.5" strokeWidth={1.75} />
      </span>
      {item.shortLabel ?? item.label}
    </Link>
  );
}

// Mobile bottom bar: the four primary destinations plus «بیشتر», which opens
// a bottom sheet with the account header, the remaining sections as cards and
// the account actions.
export function MobileBottomNav({
  items,
  moreItems = [],
  active,
  label,
  user,
  coachProfile = false,
  className,
}: {
  items: SidebarNavItem[];
  moreItems?: SidebarNavItem[];
  active: string;
  label: string;
  user: SidebarUser | null;
  coachProfile?: boolean;
  className?: string;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const signOut = useLogout();
  const dragStartY = useRef<number | null>(null);
  const moreActive = moreItems.some((item) => item.id === active);

  return (
    <>
      <nav
        aria-label={label}
        className={cn("sticky bottom-0 z-30 border-t border-border bg-card print:hidden", className)}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-16 items-stretch">
          {items.map((item) => (
            <BottomNavItem key={item.id} item={item} active={item.id === active} />
          ))}
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex min-w-16 flex-1 basis-0 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-150",
              moreActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className={cn("flex h-6 w-10 items-center justify-center rounded-full", moreActive && "bg-primary-subtle")}>
              <MenuIcon aria-hidden className="size-5.5" strokeWidth={1.75} />
            </span>
            بیشتر
          </button>
        </div>
      </nav>
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" showCloseButton={false} className="mx-auto max-w-content gap-0 rounded-t-2xl p-0">
          <SheetTitle className="sr-only">بخش های بیشتر</SheetTitle>
          <div
            className="max-h-[85dvh] overflow-y-auto overscroll-contain"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
          >
            <div
              className="touch-none pt-3 pb-2 select-none"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                dragStartY.current = event.clientY;
              }}
              onPointerMove={(event) => {
                if (dragStartY.current === null) return;
                if (event.clientY - dragStartY.current > 72) {
                  dragStartY.current = null;
                  setMoreOpen(false);
                }
              }}
              onPointerUp={() => {
                dragStartY.current = null;
              }}
              onPointerCancel={() => {
                dragStartY.current = null;
              }}
            >
              <div aria-hidden className="mx-auto h-1 w-9 rounded-full bg-border" />
            </div>
            {user ? (
              <div className="flex items-center gap-3 px-4 py-2">
                <Avatar id={user.id} name={user.name} size="md" />
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate text-sm font-semibold">{user.name}</span>
                  <span className="mt-0.5 truncate text-xs text-muted-foreground">{user.roleLabel}</span>
                </span>
              </div>
            ) : null}
            {moreItems.length > 0 ? (
              <ul className="grid grid-cols-2 gap-2 px-4 py-2">
                {moreItems.map((item) => {
                  const itemActive = item.id === active;
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        aria-current={itemActive ? "page" : undefined}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          "flex h-12 items-center gap-2.5 rounded-xl border px-3 text-sm font-medium shadow-card transition-colors duration-150",
                          itemActive ? "border-primary/20 bg-primary-subtle text-primary" : "border-border bg-card hover:bg-muted",
                        )}
                      >
                        <item.icon aria-hidden className="size-4.5 shrink-0" strokeWidth={1.75} />
                        <span className="min-w-0 truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
            {user ? (
              <ul className="flex flex-col gap-0.5 px-4 pt-1">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      setPasswordOpen(true);
                    }}
                    className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted"
                  >
                    <KeyRoundIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                    تغییر رمز عبور
                  </button>
                </li>
                {coachProfile ? (
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setMoreOpen(false);
                        setProfileOpen(true);
                      }}
                      className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted"
                    >
                      <MapPinIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                      پروفایل و شهرستان
                    </button>
                  </li>
                ) : null}
                <li>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-destructive transition-colors duration-150 hover:bg-destructive/10"
                  >
                    <LogOutIcon aria-hidden className="size-4 shrink-0" />
                    خروج از حساب
                  </button>
                </li>
              </ul>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
      {coachProfile ? <CoachProfileDialog open={profileOpen} onOpenChange={setProfileOpen} /> : null}
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </>
  );
}
