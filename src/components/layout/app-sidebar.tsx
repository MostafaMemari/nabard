import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/shared";
import { APP_NAME, APP_SUBTITLE } from "@/lib/app";
import { BrandMark } from "./brand-mark";

export type SidebarNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

export type SidebarUser = {
  id: string;
  name: string;
  roleLabel: string;
};

export function AppSidebar({
  items,
  active,
  user,
  groupLabel,
  breakpoint = "md",
}: {
  items: SidebarNavItem[];
  active: string;
  user: SidebarUser;
  groupLabel: string;
  breakpoint?: "md" | "lg";
}) {
  return (
    <aside className={cn("hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground", breakpoint === "md" ? "md:flex" : "@lg:flex")}>
      <div className="flex h-16 items-center gap-2.5 px-5">
        <BrandMark />
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-semibold text-sidebar-accent-foreground">{APP_NAME}</span>
          <span className="truncate text-xs text-sidebar-foreground/70">{APP_SUBTITLE}</span>
        </div>
      </div>
      <div className="h-px bg-sidebar-border" aria-hidden />
      <nav aria-label={groupLabel} className="flex-1 overflow-y-auto p-3">
        <p className="px-3 pt-1 pb-2 text-xs text-sidebar-foreground/60">{groupLabel}</p>
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const isActive = item.id === active;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors duration-150",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                  )}
                >
                  {isActive ? <span aria-hidden className="absolute inset-y-2 start-0 w-0.75 rounded-full bg-primary" /> : null}
                  <item.icon aria-hidden className="size-4.5 shrink-0" strokeWidth={1.75} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="h-px bg-sidebar-border" aria-hidden />
      <div className="p-3">
        <div className="flex items-center gap-2.5 rounded-lg p-2">
          <Avatar id={user.id} name={user.name} size="md" />
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-medium text-sidebar-accent-foreground">{user.name}</span>
            <span className="truncate text-xs text-sidebar-foreground/80">{user.roleLabel}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
