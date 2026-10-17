import { useCallback, useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type HeaderContext,
  type Row,
  type SortingState,
  type Updater,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Order, OrderStatus } from "@/data/types";
import { OrderDetailPanel } from "@/features/orders/order-detail";
import { formatChartDate, formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusBadge: Record<OrderStatus, string> = {
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  shipped: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  processing: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  pending: "text-muted-foreground",
  cancelled: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
};

const ORDER_STATUSES: readonly OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];
const SORTABLE_COLUMN_IDS = ["customer", "product", "region", "status", "total", "createdAt"] as const;

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

function parseStatus(value: string | null): OrderStatus | undefined {
  return isOrderStatus(value) ? value : undefined;
}

function parseDays(value: string | null): "7" | "30" | undefined {
  return value === "7" || value === "30" ? value : undefined;
}

/** Inclusive lower bound of a "last N days" window, as an ISO date string. */
function daysCutoff(days: "7" | "30"): string {
  return new Date(Date.now() - (Number(days) - 1) * 86_400_000).toISOString().slice(0, 10);
}

function paramsToSorting(params: URLSearchParams): SortingState {
  const sort = params.get("sort");
  if (!sort || !(SORTABLE_COLUMN_IDS as readonly string[]).includes(sort)) return [];
  return [{ id: sort, desc: params.get("dir") === "desc" }];
}

function paramsToColumnFilters(params: URLSearchParams): ColumnFiltersState {
  const filters: ColumnFiltersState = [];
  const status = parseStatus(params.get("status"));
  const product = params.get("product") || undefined;
  const days = parseDays(params.get("days"));
  if (status) filters.push({ id: "status", value: status });
  if (product) filters.push({ id: "product", value: product });
  if (days) filters.push({ id: "createdAt", value: days });
  return filters;
}

function resolveState<T>(updater: Updater<T>, current: T): T {
  // TanStack's Updater type is `T | ((old: T) => T)`; the typeof check narrows
  // the final updater case.
  return typeof updater === "function" ? (updater as (old: T) => T)(current) : updater;
}

/**
 * Applies only the URL params this table supports (status / product / days).
 * `q`, `sort` and `dir` are table-interaction state, not data filters.
 */
export function filterOrdersByParams(orders: Order[], params: URLSearchParams): Order[] {
  const status = parseStatus(params.get("status"));
  const product = params.get("product") || undefined;
  const days = parseDays(params.get("days"));
  return orders.filter((order) => {
    if (status && order.status !== status) return false;
    if (product && order.product !== product) return false;
    if (days && order.createdAt < daysCutoff(days)) return false;
    return true;
  });
}

function sortableHeader(label: string, alignRight = false): (ctx: HeaderContext<Order, unknown>) => ReactNode {
  return function Header({ column }) {
    const sorted = column.getIsSorted();
    const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;
    return (
      <button
        type="button"
        onClick={column.getToggleSortingHandler()}
        aria-label={`Sort by ${label}`}
        className={cn(
          "inline-flex items-center gap-1.5 font-medium",
          alignRight && "w-full justify-end",
          sorted ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {label}
        <Icon className="size-3.5" aria-hidden="true" />
      </button>
    );
  };
}

function exactMatchFilter(row: Row<Order>, columnId: string, filterValue: unknown): boolean {
  return row.getValue<string>(columnId) === filterValue;
}

function createdAtDaysFilter(row: Row<Order>, columnId: string, filterValue: unknown): boolean {
  const days = parseDays(typeof filterValue === "string" ? filterValue : null);
  if (!days) return true;
  return row.getValue<string>(columnId) >= daysCutoff(days);
}

const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "customer",
    header: sortableHeader("Customer"),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span>{row.original.customer}</span>
        <span className="text-xs text-muted-foreground">{row.original.email}</span>
      </div>
    ),
  },
  { accessorKey: "product", header: sortableHeader("Product"), filterFn: exactMatchFilter satisfies FilterFn<Order> },
  { accessorKey: "region", header: sortableHeader("Region") },
  {
    accessorKey: "status",
    header: sortableHeader("Status"),
    filterFn: exactMatchFilter satisfies FilterFn<Order>,
    cell: ({ row }) => (
      <Badge variant="outline" className={statusBadge[row.original.status]}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "total",
    header: sortableHeader("Total", true),
    cell: ({ row }) => <span className="tabular-nums">{formatCurrency(row.original.total)}</span>,
  },
  {
    accessorKey: "createdAt",
    header: sortableHeader("Created"),
    filterFn: createdAtDaysFilter,
    cell: ({ row }) => formatChartDate(row.original.createdAt),
  },
];

const filterSelectClass =
  "border-input dark:bg-input/30 flex h-9 min-w-0 appearance-none rounded-md border bg-transparent py-1 pl-3 pr-8 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

function FilterSelect({ label, value, options, onValueChange }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        aria-label={label}
        className={filterSelectClass}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export function OrdersTable({ data, onRowClick, onFilteredRowsChange }: {
  data: Order[];
  onRowClick?: (order: Order) => void;
  onFilteredRowsChange?: (orders: Order[]) => void;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const sorting = useMemo(() => paramsToSorting(searchParams), [searchParams]);
  const columnFilters = useMemo(() => paramsToColumnFilters(searchParams), [searchParams]);
  const globalFilter = useMemo(() => searchParams.get("q") ?? "", [searchParams]);

  /** Builds the next URLSearchParams from the current one, then writes back (replace, no history entry). */
  const updateParams = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          mutate(next);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleSortingChange = useCallback(
    (updater: Updater<SortingState>) => {
      const next = resolveState(updater, sorting);
      updateParams((nextParams) => {
        const first = next[0];
        if (!first) {
          nextParams.delete("sort");
          nextParams.delete("dir");
          return;
        }
        nextParams.set("sort", first.id);
        nextParams.set("dir", first.desc ? "desc" : "asc");
      });
    },
    [sorting, updateParams],
  );

  const handleColumnFiltersChange = useCallback(
    (updater: Updater<ColumnFiltersState>) => {
      const next = resolveState(updater, columnFilters);
      updateParams((nextParams) => {
        nextParams.delete("status");
        nextParams.delete("product");
        nextParams.delete("days");
        for (const filter of next) {
          if (filter.id === "status" || filter.id === "product" || filter.id === "createdAt") {
            nextParams.set(filter.id === "createdAt" ? "days" : filter.id, String(filter.value));
          }
        }
      });
    },
    [columnFilters, updateParams],
  );

  const handleGlobalFilterChange = useCallback(
    (updater: Updater<string>) => {
      const next = resolveState(updater, globalFilter);
      updateParams((nextParams) => {
        if (next) nextParams.set("q", next);
        else nextParams.delete("q");
      });
    },
    [globalFilter, updateParams],
  );

  // oxlint-disable-next-line react/incompatible-library -- TanStack Table v8's documented pattern; the instance's getter functions are read during render, not memoized across renders.
  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onGlobalFilterChange: handleGlobalFilterChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const filteredRowModel = table.getFilteredRowModel();
  const filteredOrders = useMemo(() => filteredRowModel.rows.map((row) => row.original), [filteredRowModel]);

  useEffect(() => {
    onFilteredRowsChange?.(filteredOrders);
  }, [onFilteredRowsChange, filteredOrders]);

  const productOptions = useMemo(
    () => Array.from(new Set(data.map((order) => order.product))).sort((a, b) => a.localeCompare(b)),
    [data],
  );

  const activeStatus = parseStatus(searchParams.get("status"));
  const activeProduct = searchParams.get("product") || "";
  const activeDays = parseDays(searchParams.get("days")) ?? "";
  const hasFilters = activeStatus !== undefined || activeProduct !== "" || activeDays !== "" || globalFilter !== "";

  const setParam = useCallback(
    (key: string, value: string) => {
      updateParams((nextParams) => {
        if (value) nextParams.set(key, value);
        else nextParams.delete(key);
      });
    },
    [updateParams],
  );

  const resetFilters = useCallback(() => {
    updateParams((nextParams) => {
      nextParams.delete("status");
      nextParams.delete("product");
      nextParams.delete("days");
      nextParams.delete("q");
    });
  }, [updateParams]);

  // Row detail slide-over state; every row opens it, and an optional parent
  // onRowClick still gets called (e.g. for analytics or future deep-links).
  // `order` deliberately stays mounted while the panel slides out, so the
  // close animation always has content to show.
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openDetail = useCallback(
    (order: Order) => {
      setDetailOrder(order);
      setDetailOpen(true);
      onRowClick?.(order);
    },
    [onRowClick],
  );

  const closeDetail = useCallback(() => setDetailOpen(false), []);

  const handleRowKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTableRowElement>, order: Order) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (event.key === " ") event.preventDefault();
      openDetail(order);
    },
    [openDetail],
  );

  const { pageIndex, pageSize } = table.getState().pagination;
  const total = table.getFilteredRowModel().rows.length;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);
  const rows = table.getRowModel().rows;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={globalFilter}
          onChange={(event) => setParam("q", event.target.value)}
          placeholder="Filter orders…"
          aria-label="Filter orders"
          className="min-w-0 flex-1 sm:max-w-xs"
        />
        <FilterSelect
          label="Filter by status"
          value={activeStatus ?? ""}
          onValueChange={(value) => setParam("status", value)}
          options={[
            { value: "", label: "All statuses" },
            ...ORDER_STATUSES.map((status) => ({ value: status, label: status })),
          ]}
        />
        <FilterSelect
          label="Filter by product"
          value={activeProduct}
          onValueChange={(value) => setParam("product", value)}
          options={[
            { value: "", label: "All products" },
            ...productOptions.map((product) => ({ value: product, label: product })),
          ]}
        />
        <FilterSelect
          label="Filter by date range"
          value={activeDays}
          onValueChange={(value) => setParam("days", value)}
          options={[
            { value: "", label: "All time" },
            { value: "7", label: "Last 7 days" },
            { value: "30", label: "Last 30 days" },
          ]}
        />
        {hasFilters ? (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw aria-hidden="true" />
            Reset filters
          </Button>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={header.column.id === "total" ? "text-right" : undefined}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                  No orders match your filter.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className="cursor-pointer"
                  onClick={() => openDetail(row.original)}
                  tabIndex={0}
                  onKeyDown={(event) => handleRowKeyDown(event, row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cell.column.id === "total" ? "text-right" : undefined}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-muted-foreground tabular-nums">
          Rows {from}–{to} of {total}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
      <OrderDetailPanel order={detailOrder} open={detailOpen} onClose={closeDetail} />
    </div>
  );
}
