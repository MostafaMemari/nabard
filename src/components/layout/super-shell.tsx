"use client";

import { HouseIcon, LayersIcon, MapPinnedIcon, ShieldCheckIcon, TrophyIcon, UsersIcon } from "lucide-react";
import type { ReactNode } from "react";
import { roleLabels, useMe } from "@/features/auth";
import { AppSidebar, type SidebarNavGroup, type SidebarNavItem, type SidebarUser } from "./app-sidebar";
import { MobileAccountMenu } from "./mobile-account-menu";
import { MobileBottomNav } from "./mobile-bottom-nav";

const home: SidebarNavItem = { id: "home", label: "خانه", href: "/super", icon: HouseIcon };
const admins: SidebarNavItem = {
  id: "admins",
  label: "ادمین های استان",
  shortLabel: "ادمین ها",
  href: "/super/admins",
  icon: ShieldCheckIcon,
};
const counties: SidebarNavItem = { id: "counties", label: "شهرستان ها", href: "/super/counties", icon: MapPinnedIcon };
const baseData: SidebarNavItem = {
  id: "base-data",
  label: "اطلاعات پایه",
  href: "/super/base-data",
  icon: LayersIcon,
};
const coaches: SidebarNavItem = { id: "coaches", label: "مربیان", href: "/super/coaches", icon: UsersIcon };
const competitions: SidebarNavItem = { id: "competitions", label: "مسابقات", href: "/super/competitions", icon: TrophyIcon };

const navItems: SidebarNavItem[] = [home, admins, counties, baseData, coaches, competitions];

const navGroups: SidebarNavGroup[] = [{ items: navItems }];

const mobilePrimary: SidebarNavItem[] = [home, admins, baseData, competitions];
const mobileMore: SidebarNavItem[] = navItems.filter((item) => !mobilePrimary.includes(item));

function useSidebarUser(): SidebarUser | null {
  const { user } = useMe();
  return user ? { id: user.id, name: user.fullName, roleLabel: roleLabels[user.role] } : null;
}

export function SuperShell({ active, children }: { active: string; children: ReactNode }) {
  const sidebarUser = useSidebarUser();
  const title = navItems.find((item) => item.id === active);

  return (
    <div className="flex min-h-svh bg-background">
      <a
        href="#super-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-overlay"
      >
        پرش به محتوا
      </a>
      <AppSidebar groups={navGroups} active={active} user={sidebarUser} groupLabel="ناوبری مدیریت کل" />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-card lg:hidden print:hidden">
          <div className="flex h-14 items-center justify-between gap-3 px-4">
            <span className="min-w-0 truncate text-base font-semibold">{title ? (title.shortLabel ?? title.label) : ""}</span>
            <MobileAccountMenu user={sidebarUser} />
          </div>
        </header>
        <main id="super-main" className="flex-1">
          <div className="mx-auto flex w-full max-w-content flex-col gap-6 p-4 lg:p-8 print:p-0">{children}</div>
        </main>
        <MobileBottomNav
          items={mobilePrimary}
          moreItems={mobileMore}
          groups={navGroups}
          active={active}
          label="ناوبری مدیریت کل"
          className="lg:hidden"
        />
      </div>
    </div>
  );
}
