"use client";

import { useRef } from "react";

// Drag-to-dismiss handle for bottom sheets: a 72px downward swipe closes the
// sheet, matching the system gesture.
export function SheetHandle({ onClose }: { onClose: () => void }) {
  const startY = useRef<number | null>(null);

  return (
    <div
      className="touch-none pt-3 pb-2 select-none"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        startY.current = event.clientY;
      }}
      onPointerMove={(event) => {
        if (startY.current === null) return;
        if (event.clientY - startY.current > 72) {
          startY.current = null;
          onClose();
        }
      }}
      onPointerUp={() => {
        startY.current = null;
      }}
      onPointerCancel={() => {
        startY.current = null;
      }}
    >
      <div aria-hidden className="mx-auto h-1 w-9 rounded-full bg-border" />
    </div>
  );
}
