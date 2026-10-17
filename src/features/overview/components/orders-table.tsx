import { useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type HeaderContext,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Order, OrderStatus } from "@/data/types";
import { formatChartDate, formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusBadge: Record<OrderStatus, string> = {
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  shipped: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  processing: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  pending: "text-muted-foreground",
  cancelled: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
};

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
  { accessorKey: "product", header: sortableHeader("Product") },
  { accessorKey: "region", header: sortableHeader("Region") },
  {
    accessorKey: "status",
    header: sortableHeader("Status"),
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
    cell: ({ row }) => formatChartDate(row.original.createdAt),
  },
];

export function OrdersTable({ data }: { data: Order[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // oxlint-disable-next-line react/incompatible-library -- TanStack Table v8's documented pattern; the instance's getter functions are read during render, not memoized across renders.
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const total = table.getFilteredRowModel().rows.length;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);
  const rows = table.getRowModel().rows;

  return (
    <div>
      <Input
        value={globalFilter}
        onChange={(event) => setGlobalFilter(event.target.value)}
        placeholder="Filter orders…"
        aria-label="Filter orders"
        className="mb-4 max-w-xs"
      />
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
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
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
    </div>
  );
}
