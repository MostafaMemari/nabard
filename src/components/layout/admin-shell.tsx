"use client";

import {
  ArrowLeftRightIcon,
  HouseIcon,
  MapPinnedIcon,
  ReceiptTextIcon,
  TrophyIcon,
  Undo2Icon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { roleLabels, useMe } from "@/features/auth";
import { APP_NAME } from "@/lib/app";
import { AppSidebar, type SidebarNavItem, type SidebarUser } from "./app-sidebar";
import { BrandMark } from "./brand-mark";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { MobileUserMenu } from "./mobile-user-menu";

const navItems: SidebarNavItem[] = [
  { id: "home", label: "خانه", href: "/admin", icon: HouseIcon },
  { id: "competitions", label: "مسابقات", href: "/admin/competitions", icon: TrophyIcon },
  { id: "payments", label: "بررسی پرداخت ها", shortLabel: "پرداخت ها", href: "/admin/payments", icon: ReceiptTextIcon },
  { id: "profiles", label: "بررسی پروفایل ها", shortLabel: "پروفایل ها", href: "/admin/profiles", icon: UserCheckIcon },
  { id: "county-changes", label: "درخواست های مربیان", shortLabel: "درخواست ها", href: "/admin/county-changes", icon: ArrowLeftRightIcon },
  { id: "transfer-requests", label: "درخواست های انتقال", shortLabel: "انتقال ها", href: "/admin/transfer-requests", icon: UsersIcon },
  { id: "counties", label: "شهرستان ها", shortLabel: "شهرستان ها", href: "/admin/counties", icon: MapPinnedIcon },
  { id: "refunds", label: "بازپرداخت ها", shortLabel: "بازپرداخت", href: "/admin/refunds", icon: Undo2Icon },
  { id: "coaches", label: "مربیان", href: "/admin/coaches", icon: UsersIcon },
];

function useSidebarUser(): SidebarUser | null {
  const { user } = useMe();
  return user ? { id: user.id, name: user.fullName, roleLabel: roleLabels[user.role] } : null;
}

export function AdminShell({ active, children }: { active: string; children: ReactNode }) {
  const sidebarUser = useSidebarUser();

  return (
    <div className="flex min-h-svh bg-background">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-overlay"
      >
        پرش به محتوا
      </a>
      <AppSidebar items={navItems} active={active} user={sidebarUser} groupLabel="پنل مدیریت" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center justify-between gap-2.5 border-b border-border bg-card px-4 lg:hidden print:hidden">
          <div className="flex items-center gap-2.5">
            <BrandMark className="size-7" />
            <span className="text-sm font-semibold">{APP_NAME}</span>
          </div>
          <MobileUserMenu user={sidebarUser} />
        </div>
        <main id="admin-main" className="flex-1 pb-20 lg:pb-0">
          <div className="mx-auto flex w-full max-w-content flex-col gap-6 p-4 lg:p-8 print:p-0">{children}</div>
        </main>
        <MobileBottomNav
          items={navItems.slice(0, 4)}
          moreItems={navItems.slice(4)}
          active={active}
          label="ناوبری مدیریت"
          className="lg:hidden"
        />
      </div>
    </div>
  );
}
