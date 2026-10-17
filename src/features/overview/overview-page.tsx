import { useEffect, useState } from "react";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { TrafficChart } from "@/components/charts/traffic-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDashboardData } from "@/data/mock-api";
import type { DashboardData } from "@/data/types";
import { KpiCard } from "./components/kpi-card";
import { OrdersTable } from "./components/orders-table";

type FetchState = { status: "loading" } | { status: "ready"; data: DashboardData } | { status: "error" };

function OverviewSkeleton() {
  return (
    <section aria-busy="true">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="mt-2 h-4 w-80" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i}>
            <CardContent>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-32" />
              <Skeleton className="mt-4 h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[364px] rounded-xl lg:col-span-2" />
        <Skeleton className="h-[364px] rounded-xl" />
      </div>
    </section>
  );
}

export default function OverviewPage() {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
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

  if (state.status === "loading") return <OverviewSkeleton />;

  if (state.status === "error") {
    return (
      <section>
        <p className="text-sm text-muted-foreground">{"Couldn't load dashboard data. Refresh to retry."}</p>
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
            <RevenueChart data={revenueSeries} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Traffic</CardTitle>
            <CardDescription>Visits and signups, last 90 days</CardDescription>
          </CardHeader>
          <CardContent>
            <TrafficChart data={trafficSeries} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
          <CardDescription>The 60 most recent orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <OrdersTable data={orders} />
        </CardContent>
      </Card>
    </section>
  );
}
