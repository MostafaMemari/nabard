"use client";

import {
  ArrowLeftRightIcon,
  HouseIcon,
  ImageUpIcon,
  MapPinnedIcon,
  ReceiptTextIcon,
  TrophyIcon,
  Undo2Icon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { roleLabels, useMe } from "@/features/auth";
import { AppSidebar, type SidebarNavGroup, type SidebarNavItem, type SidebarUser } from "./app-sidebar";
import { MobileAccountMenu } from "./mobile-account-menu";
import { MobileBottomNav } from "./mobile-bottom-nav";

const home: SidebarNavItem = { id: "home", label: "خانه", href: "/admin", icon: HouseIcon };
const competitions: SidebarNavItem = { id: "competitions", label: "مسابقات", href: "/admin/competitions", icon: TrophyIcon };
const payments: SidebarNavItem = {
  id: "payments",
  label: "بررسی پرداخت ها",
  shortLabel: "پرداخت ها",
  href: "/admin/payments",
  icon: ReceiptTextIcon,
};
const profiles: SidebarNavItem = {
  id: "profiles",
  label: "بررسی پروفایل ها",
  shortLabel: "پروفایل ها",
  href: "/admin/profiles",
  icon: UserCheckIcon,
};
const countyChanges: SidebarNavItem = {
  id: "county-changes",
  label: "درخواست های مربیان",
  shortLabel: "درخواست ها",
  href: "/admin/county-changes",
  icon: ArrowLeftRightIcon,
};
const transferRequests: SidebarNavItem = {
  id: "transfer-requests",
  label: "درخواست های انتقال",
  shortLabel: "انتقال ها",
  href: "/admin/transfer-requests",
  icon: UsersIcon,
};
const photoChanges: SidebarNavItem = {
  id: "photo-changes",
  label: "تغییر عکس ها",
  shortLabel: "عکس ها",
  href: "/admin/photo-changes",
  icon: ImageUpIcon,
};
const provinceChanges: SidebarNavItem = {
  id: "province-changes",
  label: "تغییر استان هنرجو",
  shortLabel: "تغییر استان",
  href: "/admin/province-changes",
  icon: MapPinnedIcon,
};
const counties: SidebarNavItem = { id: "counties", label: "شهرستان ها", href: "/admin/counties", icon: MapPinnedIcon };
const refunds: SidebarNavItem = {
  id: "refunds",
  label: "بازپرداخت ها",
  shortLabel: "بازپرداخت",
  href: "/admin/refunds",
  icon: Undo2Icon,
};
const coaches: SidebarNavItem = { id: "coaches", label: "مربیان", href: "/admin/coaches", icon: UsersIcon };

const navItems: SidebarNavItem[] = [
  home,
  competitions,
  payments,
  profiles,
  countyChanges,
  transferRequests,
  photoChanges,
  provinceChanges,
  counties,
  refunds,
  coaches,
];

const navGroups: SidebarNavGroup[] = [
  { label: "کار روزانه", items: [home, competitions, payments, profiles] },
  { label: "مدیریت", items: [countyChanges, transferRequests, photoChanges, provinceChanges, coaches, refunds] },
  { label: "تنظیمات", items: [counties] },
];

const mobilePrimary: SidebarNavItem[] = [home, competitions, payments, coaches];
const mobileMore: SidebarNavItem[] = navItems.filter((item) => !mobilePrimary.includes(item));

function useSidebarUser(): SidebarUser | null {
  const { user } = useMe();
  return user
    ? {
        id: user.id,
        name: user.fullName,
        roleLabel: roleLabels[user.role],
        photoUrl: user.photoUrl ?? undefined,
      }
    : null;
}

export function AdminShell({ active, children }: { active: string; children: ReactNode }) {
  const sidebarUser = useSidebarUser();
  const title = navItems.find((item) => item.id === active);

  return (
    <div className="flex min-h-svh bg-background">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-overlay"
      >
        پرش به محتوا
      </a>
      <AppSidebar groups={navGroups} active={active} user={sidebarUser} groupLabel="ناوبری مدیریت" />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-card lg:hidden print:hidden">
          <div className="flex h-14 items-center justify-between gap-3 px-4">
            <span className="min-w-0 truncate text-base font-semibold">{title ? (title.shortLabel ?? title.label) : ""}</span>
            <MobileAccountMenu user={sidebarUser} />
          </div>
        </header>
        <main id="admin-main" className="flex-1">
          <div className="mx-auto flex w-full max-w-content flex-col gap-6 p-4 lg:p-8 print:p-0">{children}</div>
        </main>
        <MobileBottomNav
          items={mobilePrimary}
          moreItems={mobileMore}
          groups={navGroups}
          active={active}
          label="ناوبری مدیریت"
          className="lg:hidden"
        />
      </div>
    </div>
  );
}
