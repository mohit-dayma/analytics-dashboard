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
 * Applies only the URL params the orders table supports (status / product / days).
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
