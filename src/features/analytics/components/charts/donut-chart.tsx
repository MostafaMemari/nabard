"use client";

import { formatNumber, toPersianDigits } from "@/lib/format";

export type DonutSlice = {
  id: string;
  label: string;
  value: number;
  className: string; // stroke color class of the segment
  dotClassName: string; // background color class of the legend dot
};

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Donut with a centered headline and a legend of counts.
export function DonutChart({ slices, centerValue, centerLabel }: { slices: DonutSlice[]; centerValue: string; centerLabel: string }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  let offset = 0;
  const segments = slices.map((slice) => {
    const fraction = total === 0 ? 0 : slice.value / total;
    const segment = { ...slice, dash: fraction * CIRCUMFERENCE, offset: offset * CIRCUMFERENCE };
    offset += fraction;

    return segment;
  });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0" dir="ltr">
        <svg width={140} height={140} viewBox="0 0 140 140" role="img" aria-label={`${centerLabel} ${centerValue}`}>
          <circle cx={70} cy={70} r={RADIUS} fill="none" className="stroke-muted" strokeWidth={16} />
          {segments
            .filter((segment) => segment.dash > 0)
            .map((segment) => (
              <circle
                key={segment.id}
                cx={70}
                cy={70}
                r={RADIUS}
                fill="none"
                strokeWidth={16}
                className={segment.className}
                strokeDasharray={`${segment.dash} ${CIRCUMFERENCE - segment.dash}`}
                strokeDashoffset={-segment.offset}
                transform="rotate(-90 70 70)"
              >
                <title>{`${segment.label}: ${toPersianDigits(formatNumber(segment.value))}`}</title>
              </circle>
            ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="text-display text-xl font-bold tabular-nums">{centerValue}</span>
          <span className="text-subtle text-[11px] text-muted-foreground">{centerLabel}</span>
        </div>
      </div>

      <ul className="flex w-full flex-col gap-2">
        {slices.map((slice) => (
          <li key={slice.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${slice.dotClassName}`} />
              <span>{slice.label}</span>
            </span>
            <span className="font-semibold tabular-nums">{toPersianDigits(formatNumber(slice.value))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
