import { cn } from "cn";
import Link from "next/link";
import type { SidebarNavItem } from "./app-sidebar";

function BottomNavItem({ item, active }: { item: SidebarNavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex min-h-12 min-w-20 flex-1 basis-0 flex-col items-center justify-center gap-1 px-1 text-xs font-medium transition-colors duration-150",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <item.icon aria-hidden className="size-4.5" strokeWidth={1.75} />
      {item.shortLabel ?? item.label}
      {active ? <span aria-hidden className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary" /> : null}
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
      <div className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <BottomNavItem key={item.id} item={item} active={item.id === active} />
        ))}
      </div>
    </nav>
  );
}
