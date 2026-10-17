import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { axisTick, ChartTooltip, formatCompactCurrency } from "./chart-utils";
import { formatChartDate, formatCurrency } from "@/lib/format";
import type { RevenuePoint } from "@/data/types";

// Chart title + subtitle live in the page's CardHeader; this component draws only the chart.
export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const gradientId = useId();

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          content={<ChartTooltip formatter={formatCurrency} labelFormatter={formatChartDate} labelMap={{ revenue: "Revenue" }} />}
        />
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
  );
}

