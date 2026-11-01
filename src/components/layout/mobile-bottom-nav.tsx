import { cn } from "cn";
import Link from "next/link";
import type { SidebarNavItem } from "./app-sidebar";

function BottomNavItem({ item, active }: { item: SidebarNavItem; active: boolean }) {
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

export function MobileBottomNav({
  items,
  active,
  label,
  className,
}: {
  items: SidebarNavItem[];
  active: string;
  label: string;
  className?: string;
}) {
  return (
    <nav
      aria-label={label}
      className={cn("fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card print:hidden", className)}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-4">
        {items.map((item) => (
          <BottomNavItem key={item.id} item={item} active={item.id === active} />
        ))}
      </div>
    </nav>
  );
}
