import { TrendingDown, TrendingUp } from "lucide-react";
import { Sparkline } from "@/components/charts/sparkline";
import { Card, CardContent } from "@/components/ui/card";
import type { Kpi } from "@/data/types";
import { formatCurrency, formatDelta, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

function formatKpiValue(kpi: Kpi): string {
  if (kpi.format === "currency") return formatCurrency(kpi.value);
  if (kpi.format === "percent") return formatPercent(kpi.value);
  return formatNumber(kpi.value);
}

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const up = kpi.delta >= 0;

  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted-foreground">{kpi.label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-3xl font-semibold tracking-tight tabular-nums">{formatKpiValue(kpi)}</span>
          <span
            className={cn(
              "inline-flex items-center gap-1 text-sm font-medium tabular-nums",
              up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
            )}
          >
            {up ? <TrendingUp className="size-4" aria-hidden="true" /> : <TrendingDown className="size-4" aria-hidden="true" />}
            {formatDelta(kpi.delta)}
          </span>
        </div>
        <div className="mt-3 h-10">
          <Sparkline data={kpi.spark} ariaLabel={`${kpi.label} trend`} className="h-full w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
