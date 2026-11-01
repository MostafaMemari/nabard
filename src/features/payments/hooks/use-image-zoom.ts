"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ZoomView = { scale: number; x: number; y: number };

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const WHEEL_FACTOR = 1.15;
const BUTTON_FACTOR = 1.4;
const DOUBLE_CLICK_SCALE = 2.5;

const initialView: ZoomView = { scale: 1, x: 0, y: 0 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function applyView(view: ZoomView, width: number, height: number): ZoomView {
  const scale = clamp(view.scale, MIN_SCALE, MAX_SCALE);
  const maxX = ((scale - 1) * width) / 2;
  const maxY = ((scale - 1) * height) / 2;
  return { scale, x: clamp(view.x, -maxX, maxX), y: clamp(view.y, -maxY, maxY) };
}

function zoomFromPoint(base: ZoomView, factor: number, cx: number, cy: number, width: number, height: number): ZoomView {
  const scale = clamp(base.scale * factor, MIN_SCALE, MAX_SCALE);
  if (scale === base.scale) return base;
  const ratio = scale / base.scale;
  return applyView({ scale, x: cx - ratio * (cx - base.x), y: cy - ratio * (cy - base.y) }, width, height);
}

export function useImageZoom(open: boolean) {
  const [view, setView] = useState<ZoomView>(initialView);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ px: number; py: number } | null>(null);
  const pinch = useRef<{ distance: number; base: ZoomView } | null>(null);
  const moved = useRef(0);

  useEffect(() => {
    if (open) return;
    setView(initialView);
    setDragging(false);
    pointers.current.clear();
    drag.current = null;
    pinch.current = null;
    moved.current = 0;
  }, [open]);

  const geometry = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    return {
      width: rect?.width ?? 0,
      height: rect?.height ?? 0,
      centerX: rect ? rect.left + rect.width / 2 : 0,
      centerY: rect ? rect.top + rect.height / 2 : 0,
    };
  }, []);

  const zoomBy = useCallback(
    (factor: number) => {
      const size = geometry();
      setView((current) => zoomFromPoint(current, factor, 0, 0, size.width, size.height));
    },
    [geometry],
  );

  const onWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      const size = geometry();
      const factor = event.deltaY < 0 ? WHEEL_FACTOR : 1 / WHEEL_FACTOR;
      setView((current) =>
        zoomFromPoint(current, factor, event.clientX - size.centerX, event.clientY - size.centerY, size.width, size.height),
      );
    },
    [geometry],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      moved.current = 0;
      if (pointers.current.size === 1) {
        drag.current = { px: event.clientX, py: event.clientY };
        setDragging(true);
      } else if (pointers.current.size === 2) {
        drag.current = null;
        const [first, second] = [...pointers.current.values()];
        pinch.current = { distance: Math.hypot(first.x - second.x, first.y - second.y), base: view };
      }
    },
    [view],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const previous = pointers.current.get(event.pointerId);
      if (!previous) return;
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      moved.current += Math.abs(event.clientX - previous.x) + Math.abs(event.clientY - previous.y);

      const size = geometry();
      if (pointers.current.size >= 2 && pinch.current) {
        const [first, second] = [...pointers.current.values()];
        const distance = Math.hypot(first.x - second.x, first.y - second.y);
        const factor = distance / pinch.current.distance;
        const cx = (first.x + second.x) / 2 - size.centerX;
        const cy = (first.y + second.y) / 2 - size.centerY;
        setView(zoomFromPoint(pinch.current.base, factor, cx, cy, size.width, size.height));
        return;
      }

      if (drag.current) {
        const dx = event.clientX - drag.current.px;
        const dy = event.clientY - drag.current.py;
        drag.current = { px: event.clientX, py: event.clientY };
        setView((current) => applyView({ scale: current.scale, x: current.x + dx, y: current.y + dy }, size.width, size.height));
      }
    },
    [geometry],
  );

  const endPointer = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size === 1) {
      const [remaining] = [...pointers.current.values()];
      drag.current = { px: remaining.x, py: remaining.y };
      pinch.current = null;
    } else if (pointers.current.size === 0) {
      drag.current = null;
      pinch.current = null;
      setDragging(false);
    }
  }, []);

  const onDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const size = geometry();
      const cx = event.clientX - size.centerX;
      const cy = event.clientY - size.centerY;
      setView((current) =>
        current.scale > 1
          ? applyView(initialView, size.width, size.height)
          : zoomFromPoint(current, DOUBLE_CLICK_SCALE / current.scale, cx, cy, size.width, size.height),
      );
    },
    [geometry],
  );

  return {
    view,
    dragging,
    containerRef,
    moved,
    handlers: {
      onWheel,
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
      onDoubleClick,
    },
    zoomIn: () => zoomBy(BUTTON_FACTOR),
    zoomOut: () => zoomBy(1 / BUTTON_FACTOR),
    reset: () => {
      const size = geometry();
      setView(applyView(initialView, size.width, size.height));
    },
    atMin: view.scale <= MIN_SCALE,
    atMax: view.scale >= MAX_SCALE,
  };
}
