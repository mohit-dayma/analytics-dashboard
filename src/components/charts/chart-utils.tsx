import { Fragment } from "react";
import { formatDelta } from "@/lib/format";

/** Muted dashed "Previous period" legend swatch, matching the dashed compare line. */
export function PreviousPeriodLegendItem() {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-0 w-3.5 shrink-0 border-t-2 border-dashed opacity-70" aria-hidden="true" />
      Previous period
    </span>
  );
}

interface TooltipEntry {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipEntry[];
  /** Formats the numeric value (e.g. full currency). */
  formatter?: (value: number) => string;
  /** Formats the tooltip label (e.g. ISO date -> "Mar 12"). */
  labelFormatter?: (label: string) => string;
  /** Human-readable name per dataKey; falls back to Recharts' naming. */
  labelMap?: Record<string, string>;
  /**
   * dataKey of the slot-aligned previous-period series; when that entry is in
   * the payload it renders as a muted row (with a delta) under `pairOf`.
   */
  compareKey?: string;
  /** Current-series dataKey the previous-period row pairs with. */
  pairOf?: string;
}

/** Minimal card-styled tooltip shared by the revenue and traffic charts. */
export function ChartTooltip({ active, label, payload, formatter, labelFormatter, labelMap, compareKey, pairOf }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const compareEntry = compareKey ? payload.find((entry) => String(entry.dataKey) === compareKey) : undefined;
  const rows = compareEntry ? payload.filter((entry) => entry !== compareEntry) : payload;

  return (
    <div className="rounded-lg border bg-popover px-3 py-1.5 text-xs shadow-md">
      <p className="font-medium">{labelFormatter ? labelFormatter(String(label)) : String(label)}</p>
      <ul className="mt-1 flex flex-col gap-0.5">
        {rows.map((entry) => {
          const value = typeof entry.value === "number" ? entry.value : Number(entry.value);
          const previous =
            compareEntry && String(entry.dataKey) === pairOf && typeof compareEntry.value === "number" ? compareEntry.value : undefined;
          // Inline PoP delta: (current - previous) / previous, formatted with the U+2212-aware helper.
          const delta =
            previous !== undefined && Number.isFinite(value) && Number.isFinite(previous) && previous !== 0
              ? (value - previous) / previous
              : undefined;
          return (
            <Fragment key={String(entry.dataKey)}>
              <li className="flex items-center gap-2 tabular-nums">
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color ?? "var(--muted-foreground)" }} />
                <span className="text-muted-foreground">{labelMap?.[String(entry.dataKey)] ?? String(entry.name ?? entry.dataKey)}</span>
                <span className="ml-auto font-medium">{Number.isNaN(value) ? String(entry.value) : formatter ? formatter(value) : value}</span>
              </li>
              {previous !== undefined && (
                <li className="ml-1 flex items-center gap-2 pl-3 text-[11px] text-muted-foreground tabular-nums">
                  <span className="h-0 w-2.5 shrink-0 border-t border-dashed" aria-hidden="true" />
                  <span>{labelMap?.[compareKey ?? ""] ?? "Previous period"}</span>
                  <span className="ml-auto">
                    {formatter ? formatter(previous) : previous}
                    {delta !== undefined && <span className="ml-1.5">{formatDelta(delta)}</span>}
                  </span>
                </li>
              )}
            </Fragment>
          );
        })}
      </ul>
    </div>
  );
}
