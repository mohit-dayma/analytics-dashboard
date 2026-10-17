import { useId, useMemo } from "react";
import { cn } from "@/lib/utils";
import "./sparkline.css";

interface SparklineProps {
  data: number[];
  className?: string;
  ariaLabel: string;
  showArea?: boolean;
  /** Any CSS color; defaults to the primary chart token (flips in dark mode). */
  color?: string;
}

/** Preferred y-space between the extremes and the clipped viewBox edges. */
const PAD_Y = 8;

type Point = readonly [x: number, y: number];

/**
 * Catmull-Rom -> cubic bezier: each segment's tangent is half the vector to
 * the point two neighbors away; the classic bezier approximation takes those
 * tangents scaled by 1/6 of the segment distance as control points.
 */
function catmullRomPath(points: readonly Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;

  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;

    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export function Sparkline({ data, className, ariaLabel, showArea = true, color = "var(--chart-1)" }: SparklineProps) {
  const gradientId = useId();

  const { linePath, areaPath } = useMemo(() => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1; // flat series -> center the line
    const points: Point[] = data.map((value, i) => {
      // SVG y grows downward, so invert here; PAD_Y keeps strokes inside the clip.
      const t = (value - min) / span;
      const y = PAD_Y + (1 - t) * (100 - 2 * PAD_Y);
      const x = data.length === 1 ? 0 : (i / (data.length - 1)) * 100;
      return [x, y] as const;
    });
    const line = catmullRomPath(points);
    return { linePath: line, areaPath: `${line} L 100 100 L 0 100 Z` };
  }, [data]);

  // Changing this key remounts the <g> below so the CSS draw-in replays on new data.
  const animKey = `${data.length}:${data[0] ?? 0}:${data[data.length - 1] ?? 0}`;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      role="img"
      aria-label={ariaLabel}
      className={cn("block h-full w-full", className)}
    >
      {showArea && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
      )}
      <g key={animKey} aria-hidden="true">
        {showArea && <path className="sparkline-area" d={areaPath} fill={`url(#${gradientId})`} />}
        {/* non-scaling-stroke: preserveAspectRatio="none" stretches user units,
            which would otherwise fatten the stroke when the box is wide. */}
        <path
          className="sparkline-line"
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pathLength={1}
        />
      </g>
    </svg>
  );
}
