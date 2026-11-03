"use client";

import { cn } from "cn";
import { LayoutGridIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { SidebarNavGroup } from "./app-sidebar";

// Full-height workspace sheet, grouped sections of two-column icon cards
// covering every destination of the panel, like a mobile dashboard menu.
export function WorkspaceSheet({
  open,
  onOpenChange,
  groups,
  active,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: SidebarNavGroup[];
  active: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="mx-auto h-[92dvh] max-w-content gap-0 rounded-t-2xl p-0">
        <SheetTitle className="sr-only">میز کار</SheetTitle>
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <span className="flex items-center gap-2 text-base font-semibold">
            <LayoutGridIcon aria-hidden className="size-4.5 text-primary" strokeWidth={1.75} />
            میز کار
          </span>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="بستن"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <XIcon aria-hidden className="size-5" strokeWidth={1.75} />
          </button>
        </div>
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-4 py-5"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
        >
          <div className="flex flex-col gap-6">
            {groups.map((group, groupIndex) => (
              <section key={group.label ?? groupIndex} className="flex flex-col gap-2.5">
                {group.label ? <p className="text-xs font-medium text-muted-foreground">{group.label}</p> : null}
                <ul className="grid grid-cols-2 gap-2">
                  {group.items.map((item) => {
                    const itemActive = item.id === active;
                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          aria-current={itemActive ? "page" : undefined}
                          onClick={() => onOpenChange(false)}
                          className={cn(
                            "flex h-full min-h-24 flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center shadow-card transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                            itemActive
                              ? "border-primary/20 bg-primary-subtle text-primary"
                              : "border-border bg-card text-foreground hover:bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-12 items-center justify-center rounded-full",
                              itemActive ? "bg-primary text-primary-foreground" : "bg-primary-subtle text-primary",
                            )}
                          >
                            <item.icon aria-hidden className="size-5.5" strokeWidth={1.75} />
                          </span>
                          <span className="text-sm leading-snug font-medium">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
