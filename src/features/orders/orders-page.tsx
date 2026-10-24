import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDashboardData } from "@/data/mock-api";
import { exportOrdersCsv } from "@/features/orders/csv-export";
import { filterOrdersByParams } from "@/features/orders/filter-orders";
import { OrdersTable } from "@/features/overview/components/orders-table";

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
  const [searchParams] = useSearchParams();

  // Same key family the overview page caches per range (["dashboard", RangeDays]);
  // optimistic status writes from the mutation land in this `data.orders`.
  const { data, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ["dashboard", 30],
    queryFn: () => fetchDashboardData(30),
  });

  // Derived directly from URL params (the table renders the same derivation), so the
  // Export button never needs the table to push state up.
  const filteredRows = useMemo(
    () => (data ? filterOrdersByParams(data.orders, searchParams) : []),
    [data, searchParams],
  );

  return (
    <section>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">Demo dataset — the newest orders first.</p>
      </header>

      <div className="mt-6">
        {isPending ? (
          <OrdersSkeleton />
        ) : isError || !data ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">{"Couldn't load dashboard data."}</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
              Retry
            </Button>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All orders</CardTitle>
              <CardDescription>{data.orders.length} orders — demo dataset</CardDescription>
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
              <OrdersTable data={data.orders} />
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
