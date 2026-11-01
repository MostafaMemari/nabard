"use client";

import { ClipboardListIcon, HouseIcon, TrophyIcon, UsersIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar } from "@/components/shared";
import { APP_NAME } from "@/lib/app";
import { AppSidebar, type SidebarNavItem, type SidebarUser } from "./app-sidebar";
import { BrandMark } from "./brand-mark";
import { MobileBottomNav } from "./mobile-bottom-nav";

export const coachNavItems: SidebarNavItem[] = [
  { id: "home", label: "خانه", href: "/coach", icon: HouseIcon },
  { id: "competitions", label: "مسابقات", href: "/coach/competitions", icon: TrophyIcon },
  { id: "students", label: "هنرجویان", href: "/coach/students", icon: UsersIcon },
  { id: "registrations", label: "ثبت نام های من", href: "/coach/registrations", icon: ClipboardListIcon },
];

export function CoachShell({ active, user, children }: { active: string; user: SidebarUser; children: ReactNode }) {
  return (
    <div className="@container flex min-h-svh bg-background">
      <a
        href="#coach-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-overlay"
      >
        پرش به محتوا
      </a>
      <AppSidebar items={coachNavItems} active={active} user={user} groupLabel="پنل مربی" breakpoint="@5xl" />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 shrink-0 border-b border-border bg-card @5xl:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2.5">
              <BrandMark className="size-7" />
              <span className="text-sm font-semibold">{APP_NAME}</span>
            </div>
            <Avatar id={user.id} name={user.name} size="sm" />
          </div>
        </header>
        <main id="coach-main" className="flex-1 pb-20 @5xl:pb-8">
          <div className="mx-auto flex w-full max-w-content flex-col gap-6 p-4 @5xl:p-8">{children}</div>
        </main>
        <MobileBottomNav items={coachNavItems} active={active} label="ناوبری مربی" className="@5xl:hidden" />
      </div>
    </div>
  );
}
