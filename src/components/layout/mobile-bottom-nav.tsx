"use client";

import { cn } from "cn";
import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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

// Mobile bottom navigation. Roles with more destinations than fit a thumb
// bar show the first four items and collect the rest behind «بیشتر».
export function MobileBottomNav({
  items,
  moreItems = [],
  active,
  label,
  className,
}: {
  items: SidebarNavItem[];
  moreItems?: SidebarNavItem[];
  active: string;
  label: string;
  className?: string;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = moreItems.some((item) => item.id === active);

  return (
    <>
      <nav
        aria-label={label}
        className={cn("fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card print:hidden", className)}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => (
            <BottomNavItem key={item.id} item={item} active={item.id === active} />
          ))}
          {moreItems.length > 0 ? (
            <button
              type="button"
              aria-expanded={moreOpen}
              className={cn(
                "relative flex min-h-12 min-w-20 flex-1 basis-0 flex-col items-center justify-center gap-1 px-1 text-xs font-medium transition-colors duration-150",
                moreActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setMoreOpen(true)}
            >
              <MenuIcon aria-hidden className="size-4.5" strokeWidth={1.75} />
              بیشتر
              {moreActive ? <span aria-hidden className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary" /> : null}
            </button>
          ) : null}
        </div>
      </nav>
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-content rounded-t-2xl" aria-label="بخش های بیشتر">
          <p className="px-5 pt-1 text-subtle text-muted-foreground">بخش های بیشتر</p>
          <ul className="flex flex-col gap-1 px-3 pb-6">
            {moreItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  aria-current={item.id === active ? "page" : undefined}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors duration-150",
                    item.id === active ? "bg-primary-subtle text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon aria-hidden className="size-4.5 shrink-0" strokeWidth={1.75} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
