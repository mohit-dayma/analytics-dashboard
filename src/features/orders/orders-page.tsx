import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDashboardData } from "@/data/mock-api";
import type { Order } from "@/data/types";
import { OrdersTable } from "@/features/overview/components/orders-table";

type FetchState = { status: "loading" } | { status: "ready"; data: Order[] } | { status: "error" };

function OrdersSkeleton() {
  return (
    <Card aria-busy="true">
      <CardContent>
        <Skeleton className="mb-4 h-9 w-64" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrdersPage() {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchDashboardData().then(
      (data) => {
        if (!cancelled) setState({ status: "ready", data: data.orders });
      },
      () => {
        if (!cancelled) setState({ status: "error" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">Demo dataset — 60 most recent orders.</p>
      </header>

      <div className="mt-6">
        {state.status === "loading" ? (
          <OrdersSkeleton />
        ) : state.status === "error" ? (
          <p className="text-sm text-muted-foreground">{"Couldn't load dashboard data. Refresh to retry."}</p>
        ) : (
          <Card>
            <CardContent>
              <OrdersTable data={state.data} />
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
