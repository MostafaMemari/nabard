import { cn } from "cn";
import Link from "next/link";
import type { SidebarNavItem } from "./app-sidebar";

export function SidebarLink({ item, active }: { item: SidebarNavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors duration-150",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
      )}
    >
      {active ? <span aria-hidden className="absolute inset-y-2 start-0 w-0.75 rounded-full bg-primary" /> : null}
      <item.icon aria-hidden className="size-4.5 shrink-0" strokeWidth={1.75} />
      {item.label}
    </Link>
  );
}
