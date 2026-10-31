import { ReceiptTextIcon, TrophyIcon, UsersIcon } from "lucide-react";
import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/app";
import { AppSidebar, type SidebarUser } from "./app-sidebar";
import { BrandMark } from "./brand-mark";

const navItems = [
  { id: "competitions", label: "مسابقات", href: "/admin/competitions", icon: TrophyIcon },
  { id: "payments", label: "بررسی پرداخت‌ها", href: "/admin/payments", icon: ReceiptTextIcon },
  { id: "coaches", label: "مربیان", href: "/admin/coaches", icon: UsersIcon },
];

export function AdminShell({ active, user, children }: { active: string; user: SidebarUser; children: ReactNode }) {
  return (
    <div className="flex min-h-svh bg-background">
      <AppSidebar items={navItems} active={active} user={user} groupLabel="مدیریت مسابقات" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border bg-card px-4 md:hidden">
          <BrandMark className="size-7" />
          <span className="text-sm font-semibold">{APP_NAME}</span>
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto flex w-full max-w-content flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
