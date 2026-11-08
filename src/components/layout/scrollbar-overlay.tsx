"use client";

import { cn } from "cn";
import { useCallback, useEffect, useRef, useState } from "react";

const IDLE_MS = 900;

type Metrics = {
  height: number;
  offset: number;
};

/**
 * Floating replacement for the document scrollbar (see `html[data-oscroll]`
 * in globals.css). The native scrollbar is hidden, so it never takes layout
 * space: pages no longer shift sideways when it appears and nothing is
 * reserved on pages that do not scroll. This indicator floats on the
 * inline-end edge (left side in RTL), shows while scrolling or hovering,
 * is draggable, and disappears completely on short pages. Touch devices
 * keep their native overlay scrollbars and never activate this component's
 * CSS hook.
 */
export function ScrollbarOverlay() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [visible, setVisible] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ pointerY: number; scrollY: number; maxScroll: number; travel: number } | null>(null);
  const idleRef = useRef<number | undefined>(undefined);
  const frameRef = useRef(0);
  const scrollableRef = useRef(false);

  const pulse = useCallback(() => {
    setVisible(true);
    window.clearTimeout(idleRef.current);
    idleRef.current = window.setTimeout(() => setVisible(false), IDLE_MS);
  }, []);

  const hold = useCallback(() => {
    window.clearTimeout(idleRef.current);
    setVisible(true);
  }, []);

  const measure = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const root = document.documentElement;
      const viewport = root.clientHeight;
      const total = Math.max(root.scrollHeight, document.body?.scrollHeight ?? 0);
      const scrollable = total > viewport + 1;
      if (!scrollable) {
        scrollableRef.current = false;
        setMetrics(null);
        return;
      }
      if (!scrollableRef.current) pulse();
      scrollableRef.current = true;

      const maxScroll = total - viewport;
      const height = Math.max(48, Math.floor((viewport / total) * viewport));
      const offset = Math.round((Math.min(window.scrollY, maxScroll) / maxScroll) * (viewport - height));
      setMetrics((prev) => (prev?.height === height && prev?.offset === offset ? prev : { height, offset }));
    });
  }, [pulse]);

  const handleActivity = useCallback(() => {
    measure();
    pulse();
  }, [measure, pulse]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-oscroll", "");
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(root);
    if (document.body) observer.observe(document.body);
    window.addEventListener("scroll", handleActivity, { passive: true });
    window.addEventListener("resize", handleActivity, { passive: true });
    document.fonts.ready.then(measure).catch(() => {});

    return () => {
      root.removeAttribute("data-oscroll");
      observer.disconnect();
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("resize", handleActivity);
      window.clearTimeout(idleRef.current);
      cancelAnimationFrame(frameRef.current);
    };
  }, [measure, handleActivity]);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const root = document.documentElement;
    const viewport = root.clientHeight;
    const total = Math.max(root.scrollHeight, document.body?.scrollHeight ?? 0);
    const maxScroll = total - viewport;
    dragRef.current = {
      pointerY: event.clientY,
      scrollY: window.scrollY,
      maxScroll,
      travel: metrics ? viewport - metrics.height : 0,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    setDragging(true);
  };

  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const ratio = drag.travel > 0 ? (event.clientY - drag.pointerY) / drag.travel : 0;
    const top = drag.scrollY + ratio * drag.maxScroll;
    window.scrollTo({ top: Math.min(drag.maxScroll, Math.max(0, top)) });
  };

  const endDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  if (!metrics) return null;

  return (
    <div
      aria-hidden="true"
      data-slot="scrollbar-overlay"
      onPointerEnter={hold}
      onPointerLeave={pulse}
      className={cn(
        "group fixed inset-y-0 end-0 z-40 w-3 select-none transition-opacity duration-200 print:hidden",
        visible || dragging ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div
        data-slot="scrollbar-overlay-thumb"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={cn(
          "absolute end-[2px] w-2 touch-none rounded-full bg-foreground/25 transition-colors group-hover:bg-foreground/45",
          dragging && "bg-foreground/50",
        )}
        style={{ height: metrics.height, top: metrics.offset }}
      />
    </div>
  );
}
