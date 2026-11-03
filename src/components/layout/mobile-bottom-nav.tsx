"use client";

import { cn } from "cn";
import { LayoutGridIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { SidebarNavGroup, SidebarNavItem } from "./app-sidebar";
import { WorkspaceSheet } from "./workspace-sheet";

function BottomNavItem({ item, active }: { item: SidebarNavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-w-16 flex-1 basis-0 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-150",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span className={cn("flex h-6 w-10 items-center justify-center rounded-full", active && "bg-primary-subtle")}>
        <item.icon aria-hidden className="size-5.5" strokeWidth={1.75} />
      </span>
      {item.shortLabel ?? item.label}
    </Link>
  );
}

// Mobile bottom bar: the four primary destinations plus «میز کار», which opens
// a full-height workspace sheet with every destination grouped as icon cards.
// Account actions live in their own menu behind the top bar avatar.
export function MobileBottomNav({
  items,
  moreItems = [],
  groups,
  active,
  label,
  className,
}: {
  items: SidebarNavItem[];
  moreItems?: SidebarNavItem[];
  groups: SidebarNavGroup[];
  active: string;
  label: string;
  className?: string;
}) {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const workspaceActive = moreItems.some((item) => item.id === active);

  return (
    <>
      <nav
        aria-label={label}
        className={cn("sticky bottom-0 z-30 border-t border-border bg-card print:hidden", className)}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-16 items-stretch">
          {items.map((item) => (
            <BottomNavItem key={item.id} item={item} active={item.id === active} />
          ))}
          {moreItems.length > 0 ? (
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={workspaceOpen}
              onClick={() => setWorkspaceOpen(true)}
              className={cn(
                "flex min-w-16 flex-1 basis-0 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-150",
                workspaceActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className={cn("flex h-6 w-10 items-center justify-center rounded-full", workspaceActive && "bg-primary-subtle")}>
                <LayoutGridIcon aria-hidden className="size-5.5" strokeWidth={1.75} />
              </span>
              میز کار
            </button>
          ) : null}
        </div>
      </nav>
      <WorkspaceSheet open={workspaceOpen} onOpenChange={setWorkspaceOpen} groups={groups} active={active} />
    </>
  );
}
