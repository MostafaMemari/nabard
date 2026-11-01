import { HouseIcon, ReceiptTextIcon, TrophyIcon, UsersIcon } from "lucide-react";
import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/app";
import { AppSidebar, type SidebarNavItem, type SidebarUser } from "./app-sidebar";
import { BrandMark } from "./brand-mark";
import { MobileBottomNav } from "./mobile-bottom-nav";

const navItems: SidebarNavItem[] = [
  { id: "home", label: "خانه", href: "/admin", icon: HouseIcon },
  { id: "competitions", label: "مسابقات", href: "/admin/competitions", icon: TrophyIcon },
  { id: "payments", label: "بررسی پرداخت ها", href: "/admin/payments", icon: ReceiptTextIcon },
  { id: "coaches", label: "مربیان", href: "/admin/coaches", icon: UsersIcon },
];

export function AdminShell({ active, user, children }: { active: string; user: SidebarUser; children: ReactNode }) {
  return (
    <div className="flex min-h-svh bg-background">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-overlay"
      >
        پرش به محتوا
      </a>
      <AppSidebar items={navItems} active={active} user={user} groupLabel="پنل مدیریت" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border bg-card px-4 lg:hidden">
          <BrandMark className="size-7" />
          <span className="text-sm font-semibold">{APP_NAME}</span>
        </div>
        <main id="admin-main" className="flex-1 pb-20 lg:pb-0">
          <div className="mx-auto flex w-full max-w-content flex-col gap-6 p-4 lg:p-8">{children}</div>
        </main>
        <MobileBottomNav items={navItems} active={active} label="ناوبری مدیریت" className="lg:hidden" />
      </div>
    </div>
  );
}
