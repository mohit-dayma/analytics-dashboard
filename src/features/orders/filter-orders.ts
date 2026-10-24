import type { Order, OrderStatus } from "@/data/types";

export const ORDER_STATUSES: readonly OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

export function parseStatus(value: string | null): OrderStatus | undefined {
  return isOrderStatus(value) ? value : undefined;
}

export function parseDays(value: string | null): "7" | "30" | undefined {
  return value === "7" || value === "30" ? value : undefined;
}

/** Inclusive lower bound of a "last N days" window, as an ISO date string. */
export function daysCutoff(days: "7" | "30"): string {
  return new Date(Date.now() - (Number(days) - 1) * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Applies the URL params the orders table renders as data filters (status /
 * product / days, plus the global search term `q`), so every consumer — the
 * CSV export, the command palette's export — agrees exactly with what the
 * table shows, including "?q=".
 *
 * `q` mirrors TanStack's default global filter (includesString): a
 * case-insensitive substring test over the string values of the columns'
 * accessor keys (customer, product, region, status, total, createdAt).
 * Keep this in sync when the table's column set changes.
 *
 * `sort` and `dir` are table-interaction state, not data filters.
 */
export function filterOrdersByParams(orders: Order[], params: URLSearchParams): Order[] {
  const status = parseStatus(params.get("status"));
  const product = params.get("product") || undefined;
  const days = parseDays(params.get("days"));
  const q = (params.get("q") || "").toLowerCase();
  // Accessor values TanStack's global filter can see: the cell-rendered email
  // (`customer` column) is not an accessor and therefore is not searched —
  // matching the table's `?q=` behaviour as rendered.
  const searchValues = (order: Order): string[] => [
    order.customer,
    order.product,
    order.region,
    order.status,
    String(order.total),
    order.createdAt,
  ];
  return orders.filter((order) => {
    if (status && order.status !== status) return false;
    if (product && order.product !== product) return false;
    if (days && order.createdAt < daysCutoff(days)) return false;
    if (q && !searchValues(order).some((value) => value.toLowerCase().includes(q))) return false;
    return true;
  });
}
