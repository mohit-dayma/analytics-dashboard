import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDashboardData } from "@/data/mock-api";
import type { Order } from "@/data/types";
import { exportOrdersCsv } from "@/features/orders/csv-export";
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
  const [filteredRows, setFilteredRows] = useState<Order[]>([]);

  const load = useCallback(() => {
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

  useEffect(() => load(), [load]);

  return (
    <section>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">Demo dataset — the newest orders first.</p>
      </header>

      <div className="mt-6">
        {state.status === "loading" ? (
          <OrdersSkeleton />
        ) : state.status === "error" ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">{"Couldn't load dashboard data."}</p>
            <Button
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
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All orders</CardTitle>
              <CardDescription>{state.data.length} orders — demo dataset</CardDescription>
              <CardAction>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filteredRows.length === 0}
                  onClick={() => exportOrdersCsv(filteredRows, "pulse-orders.csv")}
                >
                  <Download aria-hidden="true" />
                  Export CSV
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <OrdersTable data={state.data} onFilteredRowsChange={setFilteredRows} />
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
