import { cn } from "cn";
import { ClipboardListIcon, TrophyIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/shared";
import { APP_NAME } from "@/lib/app";
import { AppSidebar, type SidebarUser } from "./app-sidebar";
import { BrandMark } from "./brand-mark";

const navItems = [
  { id: "competitions", label: "مسابقات", href: "/coach/competitions", icon: TrophyIcon },
  { id: "students", label: "هنرجویان", href: "/coach/students", icon: UsersIcon },
  { id: "registrations", label: "ثبت‌نام‌های من", href: "/coach/registrations", icon: ClipboardListIcon },
];

export function CoachShell({ active, user, children }: { active: string; user: SidebarUser; children: ReactNode }) {
  return (
    <div className="@container flex min-h-svh bg-background">
      <AppSidebar items={navItems} active={active} user={user} groupLabel="پنل مربی" breakpoint="lg" />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 shrink-0 border-b border-border bg-card @lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2.5">
              <BrandMark className="size-7" />
              <span className="text-sm font-semibold">{APP_NAME}</span>
            </div>
            <Avatar id={user.id} name={user.name} size="sm" />
          </div>
          <nav aria-label="ناوبری مربی" className="grid grid-cols-3">
            {navItems.map((item) => {
              const isActive = item.id === active;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-12 flex-col items-center justify-center gap-1 pb-1.5 text-xs font-medium transition-colors duration-150",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <item.icon aria-hidden className="size-4.5" strokeWidth={1.75} />
                  {item.label}
                  {isActive ? <span aria-hidden className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-primary" /> : null}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="flex-1 overflow-y-auto p-4 @lg:p-8">
          <div className="mx-auto flex w-full max-w-content flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
