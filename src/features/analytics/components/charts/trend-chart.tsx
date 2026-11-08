"use client";

import { useEffect, useRef, useState } from "react";
import { toPersianDigits } from "@/lib/format";
import type { TrendPoint } from "../../types";

const HEIGHT = 240;
const PAD_X = 30;
const PAD_TOP = 28;
const PAD_BOTTOM = 42;

// Rounds up to a value that keeps the axis labels small integers.
function niceMax(value: number): number {
  if (value <= 4) return 4;
  const power = 10 ** Math.floor(Math.log10(value));
  for (const multiple of [1, 2, 4, 5, 10]) {
    const candidate = multiple * power;
    if (candidate >= value) return candidate;
  }

  return 10 * power;
}

// Line + area chart of registrations per Jalali month. Width is measured so
// text keeps its true size instead of scaling with the viewBox.
export function TrendChart({ points }: { points: TrendPoint[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const update = () => setWidth(element.clientWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const count = points.length;
  const innerWidth = Math.max(width - PAD_X * 2, 10);
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const xOf = (index: number) => (count === 1 ? PAD_X + innerWidth / 2 : PAD_X + (index * innerWidth) / (count - 1));

  const maxCount = Math.max(...points.map((point) => point.count), 1);
  const yMax = niceMax(maxCount);
  const yOf = (value: number) => PAD_TOP + (1 - value / yMax) * innerHeight;

  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"}${xOf(index)},${yOf(point.count)}`).join(" ");
  const areaPath = `${linePath} L${xOf(count - 1)},${yOf(0)} L${xOf(0)},${yOf(0)} Z`;

  const gridValues = [...new Set([0, Math.ceil(yMax / 2), yMax])];
  const maxIndex = points.reduce((best, point, index) => (point.count > points[best].count ? index : best), 0);

  // Month labels: fewer on narrow screens, always including the last month.
  const labelStep = width === 0 ? 2 : width >= count * 56 ? 1 : width >= count * 30 ? 2 : 3;
  const showLabel = (index: number) => index % labelStep === 0 || index === count - 1;

  return (
    <div ref={containerRef} className="w-full" dir="ltr">
      {width > 0 ? (
        <svg width={width} height={HEIGHT} role="img" aria-label="نمودار روند ثبت‌نام‌ها" className="overflow-visible">
          {gridValues.map((value) => (
            <g key={value}>
              <line x1={PAD_X} x2={width - PAD_X} y1={yOf(value)} y2={yOf(value)} className="stroke-border" strokeWidth={1} />
              <text x={PAD_X - 6} y={yOf(value) + 3} textAnchor="end" className="fill-muted-foreground text-[10px] tabular-nums">
                {toPersianDigits(value)}
              </text>
            </g>
          ))}

          <path d={areaPath} className="fill-primary/15" />
          <path d={linePath} fill="none" className="stroke-primary" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

          {points.map((point, index) => {
            const x = xOf(index);
            const y = yOf(point.count);
            const flip = y < PAD_TOP + 26;
            const boxWidth = 46;
            const boxX = Math.min(Math.max(x - boxWidth / 2, PAD_X - 12), width - PAD_X - boxWidth + 12);
            const label = `${point.label}: ${toPersianDigits(point.count)}`;

            return (
              <g key={point.key} className="group/point">
                <circle cx={x} cy={y} r={3.5} className="fill-primary stroke-card" strokeWidth={1.5} />
                <circle
                  cx={x}
                  cy={y}
                  r={13}
                  tabIndex={0}
                  aria-label={label}
                  className="cursor-pointer fill-transparent stroke-none focus:outline-none focus-visible:stroke-ring"
                >
                  <title>{label}</title>
                </circle>
                <g className="pointer-events-none opacity-0 transition-opacity duration-150 group-focus-visible/point:opacity-100 group-hover/point:opacity-100">
                  <rect x={boxX} y={flip ? y + 8 : y - 30} width={boxWidth} height={22} rx={6} className="fill-foreground" />
                  <text
                    x={boxX + boxWidth / 2}
                    y={flip ? y + 23 : y - 15}
                    textAnchor="middle"
                    className="fill-card text-[11px] font-medium tabular-nums"
                  >
                    {toPersianDigits(point.count)}
                  </text>
                </g>
                {showLabel(index) ? (
                  <text
                    x={x}
                    y={HEIGHT - PAD_BOTTOM + 20}
                    textAnchor={index === 0 ? "start" : index === count - 1 ? "end" : "middle"}
                    className="fill-muted-foreground text-[11px]"
                  >
                    {point.label}
                    {point.label === "فروردین" || (index === 0 && point.year !== points[points.length - 1].year)
                      ? ` ${toPersianDigits(point.year)}`
                      : ""}
                  </text>
                ) : null}
              </g>
            );
          })}

          {points[maxIndex].count > 0 ? (
            <text
              x={xOf(maxIndex)}
              y={yOf(points[maxIndex].count) - 10}
              textAnchor="middle"
              className="fill-foreground text-[11px] font-semibold tabular-nums"
            >
              {toPersianDigits(points[maxIndex].count)}
            </text>
          ) : null}
        </svg>
      ) : null}
    </div>
  );
}
