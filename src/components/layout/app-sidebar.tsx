import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import { Avatar } from "@/components/shared";
import { APP_NAME, APP_SUBTITLE } from "@/lib/app";
import { BrandMark } from "./brand-mark";
import { SidebarLink } from "./sidebar-link";

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
  breakpoint = "lg",
}: {
  items: SidebarNavItem[];
  active: string;
  user: SidebarUser;
  groupLabel: string;
  breakpoint?: "lg" | "@5xl";
}) {
  return (
    <aside
      className={cn("hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground", breakpoint === "lg" ? "lg:flex" : "@5xl:flex")}
    >
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
          {items.map((item) => (
            <li key={item.id}>
              <SidebarLink item={item} active={item.id === active} />
            </li>
          ))}
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
