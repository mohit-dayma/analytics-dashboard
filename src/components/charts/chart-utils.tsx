/** Tick/label defaults shared by all charts for a consistent look. */
export const axisTick = { fill: "var(--muted-foreground)", fontSize: 12 } as const;

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});
const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** Y-axis tick formatter: "$12.3K". */
export function formatCompactCurrency(value: number): string {
  return compactCurrency.format(value);
}

/** Y-axis tick formatter for counts: "12.3K". */
export function formatCompactNumber(value: number): string {
  return compactNumber.format(value);
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
}

/** Minimal card-styled tooltip shared by the revenue and traffic charts. */
export function ChartTooltip({ active, label, payload, formatter, labelFormatter, labelMap }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border bg-popover px-3 py-1.5 text-xs shadow-md">
      <p className="font-medium">{labelFormatter ? labelFormatter(String(label)) : String(label)}</p>
      <ul className="mt-1 flex flex-col gap-0.5">
        {payload.map((entry) => {
          const value = typeof entry.value === "number" ? entry.value : Number(entry.value);
          return (
            <li key={String(entry.dataKey)} className="flex items-center gap-2 tabular-nums">
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color ?? "var(--muted-foreground)" }} />
              <span className="text-muted-foreground">{labelMap?.[String(entry.dataKey)] ?? String(entry.name ?? entry.dataKey)}</span>
              <span className="ml-auto font-medium">{Number.isNaN(value) ? String(entry.value) : formatter ? formatter(value) : value}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
