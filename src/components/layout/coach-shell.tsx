"use client";

import { ClipboardListIcon, HouseIcon, TrophyIcon, UsersIcon } from "lucide-react";
import type { ReactNode } from "react";
import { roleLabels, useMe } from "@/features/auth";
import { AppSidebar, type SidebarNavGroup, type SidebarNavItem, type SidebarUser } from "./app-sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";

const home: SidebarNavItem = { id: "home", label: "خانه", href: "/coach", icon: HouseIcon };
const competitions: SidebarNavItem = { id: "competitions", label: "مسابقات", href: "/coach/competitions", icon: TrophyIcon };
const students: SidebarNavItem = { id: "students", label: "هنرجویان", href: "/coach/students", icon: UsersIcon };
const registrations: SidebarNavItem = {
  id: "registrations",
  label: "ثبت نام های من",
  shortLabel: "ثبت نام ها",
  href: "/coach/registrations",
  icon: ClipboardListIcon,
};

export const coachNavItems: SidebarNavItem[] = [home, competitions, students, registrations];

const navGroups: SidebarNavGroup[] = [{ items: coachNavItems }];

function useSidebarUser(): SidebarUser | null {
  const { user } = useMe();
  return user ? { id: user.id, name: user.fullName, roleLabel: roleLabels[user.role] } : null;
}

export function CoachShell({ active, children }: { active: string; children: ReactNode }) {
  const sidebarUser = useSidebarUser();
  const title = coachNavItems.find((item) => item.id === active);

  return (
    <div className="@container flex min-h-svh bg-background">
      <a
        href="#coach-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-overlay"
      >
        پرش به محتوا
      </a>
      <AppSidebar groups={navGroups} active={active} user={sidebarUser} groupLabel="ناوبری مربی" coachProfile breakpoint="@5xl" />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-card @5xl:hidden print:hidden">
          <div className="flex h-14 items-center px-4">
            <span className="truncate text-base font-semibold">{title ? (title.shortLabel ?? title.label) : ""}</span>
          </div>
        </header>
        <main id="coach-main" className="flex-1">
          <div className="mx-auto flex w-full max-w-content flex-col gap-6 p-4 @5xl:p-8">{children}</div>
        </main>
        <MobileBottomNav
          items={coachNavItems}
          active={active}
          user={sidebarUser}
          coachProfile
          label="ناوبری مربی"
          className="@5xl:hidden"
        />
      </div>
    </div>
  );
}
