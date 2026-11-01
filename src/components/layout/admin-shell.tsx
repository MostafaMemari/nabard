import { cn } from "cn";
import { HouseIcon, ReceiptTextIcon, TrophyIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/app";
import { AppSidebar, type SidebarNavItem, type SidebarUser } from "./app-sidebar";
import { BrandMark } from "./brand-mark";

const navItems: SidebarNavItem[] = [
  { id: "home", label: "خانه", href: "/admin", icon: HouseIcon },
  { id: "competitions", label: "مسابقات", href: "/admin/competitions", icon: TrophyIcon },
  { id: "payments", label: "بررسی پرداخت ها", href: "/admin/payments", icon: ReceiptTextIcon },
  { id: "coaches", label: "مربیان", href: "/admin/coaches", icon: UsersIcon },
];

function MobileNavItem({ item, active }: { item: SidebarNavItem; active: boolean }) {
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

export function AdminShell({ active, user, children }: { active: string; user: SidebarUser; children: ReactNode }) {
  return (
    <div className="flex min-h-svh bg-background">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-overlay"
      >
        پرش به محتوا
      </a>
      <AppSidebar items={navItems.slice(1)} active={active} user={user} groupLabel="مدیریت مسابقات" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border bg-card px-4 md:hidden">
          <BrandMark className="size-7" />
          <span className="text-sm font-semibold">{APP_NAME}</span>
        </div>
        <main id="admin-main" className="flex-1 pb-20 md:pb-0">
          <div className="mx-auto flex w-full max-w-content flex-col gap-6 p-4 md:p-8">{children}</div>
        </main>
        <nav
          aria-label="ناوبری مدیریت"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card md:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="grid grid-cols-4">
            {navItems.map((item) => (
              <MobileNavItem key={item.id} item={item} active={item.id === active} />
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
