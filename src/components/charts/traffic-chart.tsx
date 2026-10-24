import { useId, useMemo } from "react";
import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip, PreviousPeriodLegendItem } from "./chart-utils";
import { axisTick, formatCompactNumber, trafficWithCompare } from "./chart-data";
import { formatChartDate, formatNumber } from "@/lib/format";
import type { TrafficPoint } from "@/data/types";

interface TrafficChartProps {
  data: TrafficPoint[];
  /** Previous-window series slot-aligned onto the current x positions; null/absent = no comparison. */
  compare?: TrafficPoint[] | null;
}

// Chart title + subtitle live in the page's CardHeader; this component draws only the chart.
export function TrafficChart({ data, compare }: TrafficChartProps) {
  const gradientId = useId();
  const showCompare = (compare?.length ?? 0) > 0;
  const chartData = useMemo(() => (showCompare ? trafficWithCompare(data, compare) : data), [data, compare, showCompare]);

  return (
    <div>
      {/* Minimal legend: two series (signups vs visits) aren't self-evident by color alone. */}
      <div className="mb-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: "var(--chart-2)" }} aria-hidden="true" />
          Signups
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: "var(--chart-3)" }} aria-hidden="true" />
          Visits
        </span>
        {showCompare && <PreviousPeriodLegendItem />}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => formatChartDate(value)}
            minTickGap={40}
            axisLine={false}
            tickLine={false}
            tick={axisTick}
          />
          <YAxis
            width={48}
            tickFormatter={(value: number) => formatCompactNumber(value)}
            axisLine={false}
            tickLine={false}
            tick={axisTick}
          />
          <Tooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeOpacity: 0.2 }}
            content={
              <ChartTooltip
                formatter={formatNumber}
                labelFormatter={formatChartDate}
                labelMap={{ signups: "Signups", visits: "Visits", previous: "Previous period" }}
                compareKey={showCompare ? "previous" : undefined}
                pairOf="visits"
              />
            }
          />
          {/* Compare renders first so the current series paint over it, keeping it quiet.
              Visits is compared on purpose: one muted dashed line reads cleaner than two. */}
          {showCompare && (
            <Line
              type="monotone"
              dataKey="previous"
              stroke="var(--muted-foreground)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              strokeOpacity={0.7}
              dot={false}
              activeDot={false}
            />
          )}
          <Area type="monotone" dataKey="signups" stroke="var(--chart-2)" strokeWidth={2} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 3 }} />
          <Line type="monotone" dataKey="visits" stroke="var(--chart-3)" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
