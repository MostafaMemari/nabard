import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import { APP_NAME, APP_SUBTITLE } from "@/lib/app";
import { BrandMark } from "./brand-mark";
import { SidebarLink } from "./sidebar-link";
import { SidebarUserMenu } from "./sidebar-user-menu";

export type SidebarNavItem = {
  id: string;
  label: string;
  shortLabel?: string;
  href: string;
  icon: LucideIcon;
};

export type SidebarNavGroup = {
  label?: string;
  items: SidebarNavItem[];
};

export type SidebarUser = {
  id: string;
  name: string;
  roleLabel: string;
  photoUrl?: string;
};

// Three zones: fixed brand header, scrollable nav, user block pinned to the
// bottom of the viewport. Long menus scroll only inside the nav zone.
export function AppSidebar({
  groups,
  active,
  user,
  groupLabel,
  coachProfile = false,
  breakpoint = "lg",
}: {
  groups: SidebarNavGroup[];
  active: string;
  user: SidebarUser | null;
  groupLabel: string;
  coachProfile?: boolean;
  breakpoint?: "lg" | "@5xl";
}) {
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground print:hidden",
        breakpoint === "lg" ? "lg:flex" : "@5xl:flex",
      )}
    >
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-5">
        <BrandMark />
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-semibold text-sidebar-accent-foreground">{APP_NAME}</span>
          <span className="truncate text-xs text-sidebar-foreground/70">{APP_SUBTITLE}</span>
        </div>
      </div>
      <div className="h-px shrink-0 bg-sidebar-border" aria-hidden />
      <nav
        aria-label={groupLabel}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-color:var(--sidebar-border)_transparent] [scrollbar-width:thin]"
      >
        <div className="flex flex-col gap-4">
          {groups.map((group, groupIndex) => (
            <div key={group.label ?? groupIndex} className="flex flex-col gap-0.5">
              {group.label ? <p className="px-3 pb-1.5 text-xs text-sidebar-foreground/60">{group.label}</p> : null}
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <SidebarLink item={item} active={item.id === active} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>
      <div className="h-px shrink-0 bg-sidebar-border" aria-hidden />
      <div className="shrink-0 p-3">
        <SidebarUserMenu user={user} coachProfile={coachProfile} />
      </div>
    </aside>
  );
}
