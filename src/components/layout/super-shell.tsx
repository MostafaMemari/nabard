"use client";

import { HouseIcon, LayersIcon, MapPinnedIcon, ShieldCheckIcon, TrophyIcon, UsersIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar } from "@/components/shared";
import { ChangePasswordButton, roleLabels, useMe } from "@/features/auth";
import { APP_NAME } from "@/lib/app";
import { AppSidebar, type SidebarNavItem, type SidebarUser } from "./app-sidebar";
import { BrandMark } from "./brand-mark";
import { LogoutButton } from "./logout-button";
import { MobileBottomNav } from "./mobile-bottom-nav";

const navItems: SidebarNavItem[] = [
  { id: "home", label: "خانه", href: "/super", icon: HouseIcon },
  { id: "admins", label: "ادمین های استان", shortLabel: "ادمین ها", href: "/super/admins", icon: ShieldCheckIcon },
  { id: "counties", label: "شهرستان ها", shortLabel: "شهرستان ها", href: "/super/counties", icon: MapPinnedIcon },
  { id: "base-data", label: "اطلاعات پایه", shortLabel: "اطلاعات پایه", href: "/super/base-data", icon: LayersIcon },
  { id: "coaches", label: "مربیان", href: "/super/coaches", icon: UsersIcon },
  { id: "competitions", label: "مسابقات", href: "/super/competitions", icon: TrophyIcon },
];

function useSidebarUser(): SidebarUser | null {
  const { user } = useMe();
  return user ? { id: user.id, name: user.fullName, roleLabel: roleLabels[user.role] } : null;
}

export function SuperShell({ active, children }: { active: string; children: ReactNode }) {
  const sidebarUser = useSidebarUser();

  return (
    <div className="flex min-h-svh bg-background">
      <a
        href="#super-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-overlay"
      >
        پرش به محتوا
      </a>
      <AppSidebar items={navItems} active={active} user={sidebarUser} groupLabel="پنل مدیریت کل" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center justify-between gap-2.5 border-b border-border bg-card px-4 lg:hidden print:hidden">
          <div className="flex items-center gap-2.5">
            <BrandMark className="size-7" />
            <span className="text-sm font-semibold">{APP_NAME}</span>
          </div>
          <div className="flex items-center gap-1">
            {sidebarUser ? (
              <Avatar id={sidebarUser.id} name={sidebarUser.name} size="sm" />
            ) : (
              <span aria-hidden className="size-7 rounded-full bg-muted" />
            )}
            <ChangePasswordButton />
            <LogoutButton />
          </div>
        </div>
        <main id="super-main" className="flex-1 pb-20 lg:pb-0">
          <div className="mx-auto flex w-full max-w-content flex-col gap-6 p-4 lg:p-8 print:p-0">{children}</div>
        </main>
        <MobileBottomNav items={navItems} active={active} label="ناوبری مدیریت کل" className="lg:hidden" />
      </div>
    </div>
  );
}
