import { Suspense, lazy, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDashboardData } from "@/data/mock-api";
import type { RangeDays } from "@/data/types";
import { cn } from "@/lib/utils";
import { KpiCard } from "./components/kpi-card";
import { OrdersTable } from "./components/orders-table";

const RevenueChart = lazy(() =>
  import("@/components/charts/revenue-chart").then((m) => ({ default: m.RevenueChart })),
);
const TrafficChart = lazy(() =>
  import("@/components/charts/traffic-chart").then((m) => ({ default: m.TrafficChart })),
);

type RangeOption = { value: RangeDays; label: string };

const RANGES: ReadonlyArray<RangeOption> = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
];

/** Maps the raw `range` search param to a valid window; anything else falls back to 30 days. */
function sanitizeRange(raw: string | null): RangeDays {
  return raw === "7" ? 7 : raw === "90" ? 90 : 30;
}

/** Last `count` points of an ascending series — its window-sized trailing slice. */
function sliceLast<T>(series: T[], count: number): T[] {
  return count >= series.length ? series : series.slice(series.length - count);
}

const CHART_SKELETON_TICKS = 8;

function ChartCardSkeletonBody() {
  return (
    <div aria-hidden="true" className="flex h-[280px] flex-col">
      <div className="flex flex-1 gap-3 pb-2">
        <div className="flex flex-col items-start justify-between py-1">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
        </div>
        <div className="flex flex-1 flex-col justify-between">
          <Skeleton className="h-1.5 w-full" />
          <Skeleton className="h-1.5 w-full opacity-60" />
          <Skeleton className="h-1.5 w-full opacity-40" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {Array.from({ length: CHART_SKELETON_TICKS }, (_, i) => (
          <Skeleton key={i} className="h-3 w-6 rounded-sm" />
        ))}
      </div>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div role="status" className="flex min-h-[280px] items-center justify-center">
      <p className="text-sm text-muted-foreground">
        <span className="sr-only">{label}: </span>
        No data for this range.
      </p>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <Card>
      <CardContent>
        <Skeleton className="h-4 w-24" />
        <div className="mt-1 flex items-baseline gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="mt-3 h-10 w-full" />
      </CardContent>
    </Card>
  );
}

function ChartCardSkeleton({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div role="status">
          <ChartCardSkeletonBody />
        </div>
      </CardContent>
    </Card>
  );
}

function OverviewSkeleton() {
  return (
    <section aria-busy="true">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="mt-2 h-4 w-80" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <ChartCardSkeleton
          className="lg:col-span-2"
          title="Revenue"
          description="Daily revenue, last 90 days"
        />
        <ChartCardSkeleton title="Traffic" description="Visits and signups, last 90 days" />
      </div>
    </section>
  );
}

/** Segmented range switcher; dims subtly while a range is refetching (no animation, reduced-motion safe). */
function RangeSwitcher({
  value,
  isFetching,
  onSelect,
}: {
  value: RangeDays;
  isFetching: boolean;
  onSelect: (value: RangeDays) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Chart date range"
      aria-busy={isFetching || undefined}
      className={cn(
        "inline-flex gap-1 rounded-md bg-muted/50 p-1",
        isFetching && "opacity-70",
      )}
    >
      {RANGES.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(option.value)}
            className={cn(
              "rounded-sm px-3 py-1 text-sm font-medium",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function DashboardError({ onRetry, isRetrying }: { onRetry: () => void; isRetrying: boolean }) {
  return (
    <section>
      <p className="text-sm text-muted-foreground">Couldn&apos;t load dashboard data.</p>
      <Button className="mt-3" variant="outline" size="sm" onClick={onRetry} disabled={isRetrying}>
        Retry
      </Button>
    </section>
  );
}

export default function OverviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rangeDays = sanitizeRange(searchParams.get("range"));

  const { data, isError, isFetching, refetch } = useQuery({
    queryKey: ["dashboard", rangeDays],
    queryFn: () => fetchDashboardData(rangeDays),
    // Keep the current range's content on screen while a new range loads; no skeleton flash.
    placeholderData: (previous) => previous,
  });

  const setRange = useCallback(
    (value: RangeDays) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          next.set("range", String(value));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  if (isError && !data) {
    return <DashboardError onRetry={() => void refetch()} isRetrying={isFetching} />;
  }

  if (!data) {
    return <OverviewSkeleton />;
  }

  const { kpis, orders } = data;
  const revenueWindow = sliceLast(data.revenueSeries, rangeDays);
  const trafficWindow = sliceLast(data.trafficSeries, rangeDays);

  return (
    <section>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">
            Demo dataset — {rangeDays} days of activity. All numbers are seeded mock data.
          </p>
        </div>
        <RangeSwitcher value={rangeDays} isFetching={isFetching} onSelect={setRange} />
      </header>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Daily revenue, last {rangeDays} days</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ChartCardSkeletonBody />}>
              {revenueWindow.length === 0 ? (
                <EmptyChart label="Revenue" />
              ) : (
                <RevenueChart data={revenueWindow} compare={data.compareRevenueSeries} />
              )}
            </Suspense>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Traffic</CardTitle>
            <CardDescription>Visits and signups, last {rangeDays} days</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ChartCardSkeletonBody />}>
              {trafficWindow.length === 0 ? (
                <EmptyChart label="Traffic" />
              ) : (
                <TrafficChart data={trafficWindow} compare={data.compareTrafficSeries} />
              )}
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
          <CardDescription>The {orders.length} most recent orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <OrdersTable data={orders} />
        </CardContent>
      </Card>
    </section>
  );
}
