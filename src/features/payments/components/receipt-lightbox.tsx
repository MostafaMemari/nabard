"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "cn";
import { ExternalLinkIcon, MinusIcon, PlusIcon, RotateCcwIcon, XIcon } from "lucide-react";
import { toPersianDigits } from "@/lib/format";
import { useImageZoom } from "../hooks/use-image-zoom";

const toolButton =
  "flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:pointer-events-none disabled:opacity-40";

export function ReceiptLightbox({ open, onOpenChange, src }: { open: boolean; onOpenChange: (open: boolean) => void; src: string }) {
  const zoom = useImageZoom(open);
  const zoomed = zoom.view.scale > 1;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/85 duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex flex-col outline-none">
          <DialogPrimitive.Title className="sr-only">نمایش بزرگ تصویر رسید</DialogPrimitive.Title>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: zoom and pan surface, keyboard users close via Escape or the close button */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: click on empty space only hides the lightbox, closing by keyboard is already covered by Escape and the close button */}
          <div
            {...zoom.handlers}
            ref={zoom.containerRef}
            onClick={(event) => {
              if (event.target === event.currentTarget && zoom.moved.current <= 5) onOpenChange(false);
            }}
            className={cn(
              "flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4 select-none touch-none",
              zoomed ? (zoom.dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default",
            )}
          >
            {/* biome-ignore lint/performance/noImgElement: private receipt served by an authenticated endpoint */}
            <img
              src={src}
              alt="تصویر رسید پرداخت کارت به کارت در اندازه بزرگ"
              draggable={false}
              decoding="async"
              style={{ transform: `translate(${zoom.view.x}px, ${zoom.view.y}px) scale(${zoom.view.scale})` }}
              className="max-h-full max-w-full rounded-lg shadow-2xl"
            />
          </div>
          <div className="flex justify-center pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-2">
            <div className="flex items-center gap-1.5 rounded-full bg-white/10 p-1.5 shadow-overlay backdrop-blur-sm">
              <button
                type="button"
                className={toolButton}
                onClick={zoom.zoomOut}
                disabled={zoom.atMin}
                aria-label="کوچک نمایی"
                title="کوچک نمایی"
              >
                <MinusIcon className="size-4" />
              </button>
              <span className="min-w-12 text-center text-sm text-white tabular-nums">
                {toPersianDigits(Math.round(zoom.view.scale * 100))}٪
              </span>
              <button
                type="button"
                className={toolButton}
                onClick={zoom.zoomIn}
                disabled={zoom.atMax}
                aria-label="بزرگ نمایی"
                title="بزرگ نمایی"
              >
                <PlusIcon className="size-4" />
              </button>
              <span aria-hidden className="h-5 w-px bg-white/20" />
              <button
                type="button"
                className={toolButton}
                onClick={zoom.reset}
                disabled={!zoomed}
                aria-label="اندازه اصلی"
                title="اندازه اصلی"
              >
                <RotateCcwIcon className="size-4" />
              </button>
              <a
                className={toolButton}
                href={src}
                target="_blank"
                rel="noreferrer"
                aria-label="باز کردن در تب جدید"
                title="باز کردن در تب جدید"
              >
                <ExternalLinkIcon className="size-4" />
              </a>
              <DialogPrimitive.Close className={cn(toolButton, "hover:bg-white/20")} aria-label="بستن" title="بستن">
                <XIcon className="size-4" />
              </DialogPrimitive.Close>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
