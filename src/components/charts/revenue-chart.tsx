import { useId, useMemo } from "react";
import { Area, AreaChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip, PreviousPeriodLegendItem } from "./chart-utils";
import { axisTick, formatCompactCurrency, revenueWithCompare } from "./chart-data";
import { formatChartDate, formatCurrency } from "@/lib/format";
import type { RevenuePoint } from "@/data/types";

interface RevenueChartProps {
  data: RevenuePoint[];
  /** Previous-window series slot-aligned onto the current x positions; null/absent = no comparison. */
  compare?: RevenuePoint[] | null;
}

// Chart title + subtitle live in the page's CardHeader; this component draws only the chart.
export function RevenueChart({ data, compare }: RevenueChartProps) {
  const gradientId = useId();
  const showCompare = (compare?.length ?? 0) > 0;
  const chartData = useMemo(() => (showCompare ? revenueWithCompare(data, compare) : data), [data, compare, showCompare]);

  return (
    <div>
      {/* Legend only appears with a comparison; the area itself is self-evident otherwise. */}
      {showCompare && (
        <div className="mb-2 flex items-center gap-4 text-xs text-muted-foreground">
          <PreviousPeriodLegendItem />
        </div>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
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
            tickFormatter={(value: number) => formatCompactCurrency(value)}
            axisLine={false}
            tickLine={false}
            tick={axisTick}
          />
          <Tooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeOpacity: 0.2 }}
            content={
              <ChartTooltip
                formatter={formatCurrency}
                labelFormatter={formatChartDate}
                labelMap={{ revenue: "Revenue", previous: "Previous period" }}
                compareKey={showCompare ? "previous" : undefined}
                pairOf="revenue"
              />
            }
          />
          {/* Compare renders first so the current gradient area paints over it, keeping it quiet. */}
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
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
