import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDashboardData } from "@/data/mock-api";
import type { DashboardData } from "@/data/types";
import { KpiCard } from "./components/kpi-card";
import { OrdersTable } from "./components/orders-table";

const RevenueChart = lazy(() =>
  import("@/components/charts/revenue-chart").then((m) => ({ default: m.RevenueChart })),
);
const TrafficChart = lazy(() =>
  import("@/components/charts/traffic-chart").then((m) => ({ default: m.TrafficChart })),
);

type FetchState = { status: "loading" } | { status: "ready"; data: DashboardData } | { status: "error" };

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

export default function OverviewPage() {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  const load = useCallback(() => {
    let cancelled = false;
    fetchDashboardData().then(
      (data) => {
        if (!cancelled) setState({ status: "ready", data });
      },
      () => {
        if (!cancelled) setState({ status: "error" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  if (state.status === "loading") return <OverviewSkeleton />;

  if (state.status === "error") {
    return (
      <section>
        <p className="text-sm text-muted-foreground">Couldn&apos;t load dashboard data.</p>
        <Button
          className="mt-3"
          variant="outline"
          size="sm"
          // setState in the event handler (not an effect) is what flips the retry into the skeleton state.
          onClick={() => {
            setState({ status: "loading" });
            load();
          }}
        >
          Retry
        </Button>
      </section>
    );
  }

  const { kpis, revenueSeries, trafficSeries, orders } = state.data;

  return (
    <section>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Demo dataset — 90 days of activity. All numbers are seeded mock data.</p>
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
            <CardDescription>Daily revenue, last 90 days</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ChartCardSkeletonBody />}>
              {revenueSeries.length === 0 ? (
                <EmptyChart label="Revenue" />
              ) : (
                <RevenueChart data={revenueSeries} />
              )}
            </Suspense>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Traffic</CardTitle>
            <CardDescription>Visits and signups, last 90 days</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ChartCardSkeletonBody />}>
              {trafficSeries.length === 0 ? (
                <EmptyChart label="Traffic" />
              ) : (
                <TrafficChart data={trafficSeries} />
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
