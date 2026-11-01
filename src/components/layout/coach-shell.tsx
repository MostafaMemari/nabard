"use client";

import { cn } from "cn";
import { ClipboardListIcon, HouseIcon, TrophyIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/shared";
import { APP_NAME } from "@/lib/app";
import { AppSidebar, type SidebarNavItem, type SidebarUser } from "./app-sidebar";
import { BrandMark } from "./brand-mark";

export const coachNavItems: SidebarNavItem[] = [
  { id: "home", label: "خانه", href: "/coach", icon: HouseIcon },
  { id: "competitions", label: "مسابقات", href: "/coach/competitions", icon: TrophyIcon },
  { id: "students", label: "هنرجویان", href: "/coach/students", icon: UsersIcon },
  { id: "registrations", label: "ثبت نام های من", href: "/coach/registrations", icon: ClipboardListIcon },
];

function BottomNavItem({ item, active }: { item: SidebarNavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex min-h-12 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-150",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <item.icon aria-hidden className="size-4.5" strokeWidth={1.75} />
      {item.label}
      {active ? <span aria-hidden className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-primary" /> : null}
    </Link>
  );
}

export function CoachShell({ active, user, children }: { active: string; user: SidebarUser; children: ReactNode }) {
  return (
    <div className="@container flex min-h-svh bg-background">
      <a
        href="#coach-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-overlay"
      >
        پرش به محتوا
      </a>
      <AppSidebar items={coachNavItems} active={active} user={user} groupLabel="پنل مربی" breakpoint="lg" />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 shrink-0 border-b border-border bg-card @lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2.5">
              <BrandMark className="size-7" />
              <span className="text-sm font-semibold">{APP_NAME}</span>
            </div>
            <Avatar id={user.id} name={user.name} size="sm" />
          </div>
        </header>
        <main id="coach-main" className="flex-1 pb-20 @lg:pb-8">
          <div className="mx-auto flex w-full max-w-content flex-col gap-6 p-4 @lg:p-8">{children}</div>
        </main>
        <nav
          aria-label="ناوبری مربی"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card @lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="grid grid-cols-4">
            {coachNavItems.map((item) => (
              <BottomNavItem key={item.id} item={item} active={item.id === active} />
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
