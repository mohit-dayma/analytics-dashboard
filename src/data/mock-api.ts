import type { DashboardData, Order, OrderStatus, RangeDays } from "@/data/types";
import {
  activeUserShare,
  orders as orderStore,
  revenueSeries,
  trafficSeries,
} from "@/data/seed";
import { buildCompareSeries, buildKpis, normalizeRangeDays } from "@/data/range";

// Simulates real network latency so the UI genuinely exercises loading/suspense patterns.
const LATENCY_MS = 300;
// Slow-payment simulation: every 4th update resolves after this long instead (fault injection).
const SLOW_LATENCY_MS = 1500;
const DEFAULT_RANGE_DAYS: RangeDays = 30;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Single seam to swap for a real backend: reimplement fetchDashboardData against an API,
// keep the DashboardData contract, and everything else in the app stays unchanged.
// Pure data module by design: no React, no query client, no UI state in here.
export async function fetchDashboardData(rangeDays: RangeDays = DEFAULT_RANGE_DAYS): Promise<DashboardData> {
  const range = normalizeRangeDays(rangeDays);
  await delay(LATENCY_MS);

  const compares = buildCompareSeries(range, revenueSeries, trafficSeries);

  // Fresh snapshots per call: the seeded arrays act as the "database" and the UI
  // receives copies, so client-side (possibly optimistic) mutations can never
  // leak back into the dataset — only updateOrderStatus writes to it.
  return {
    kpis: buildKpis(range, revenueSeries, trafficSeries, activeUserShare),
    revenueSeries: [...revenueSeries],
    compareRevenueSeries: compares.revenue,
    trafficSeries: [...trafficSeries],
    compareTrafficSeries: compares.traffic,
    orders: orderStore.map((order) => ({ ...order })),
    rangeDays: range,
  };
}

// ---------------------------------------------------------------------------
// Order status updates — the optimistic-update seam
//
// Transition rules enforced here (the "backend" owns validation):
//   - the status must actually change; issuing the current status rejects with
//     the "unchanged-status" error code
//   - "cancelled" is terminal: a cancelled order can never move again and any
//     update targeting one rejects with the "cancelled-order" error code
//   - everything else is accepted: the forward flow pending -> processing ->
//     shipped -> delivered (including jumps, e.g. pending -> delivered) plus
//     moving any non-cancelled order to "cancelled"
//
// Deterministic fault injection via a module-level call counter (per session):
//   updateOrderStatus call #n
//     n % 7 === 0 -> REJECT after 300ms: Error("Payment service unreachable — try again")
//     n % 4 === 0 -> resolve after 1500ms (slow payment gateway)
//     otherwise   -> resolve after 300ms
//   Calls hitting both rules (28, 56, ...) reject — payment failure outranks slowness.
// ---------------------------------------------------------------------------

export type UpdateOrderStatusErrorCode = "unchanged-status" | "cancelled-order" | "not-found";
export type UpdateOrderStatusResult = { order: Order };
export type UpdateOrderStatusError = Error & { code: UpdateOrderStatusErrorCode };

let updateSessionCount = 0;

function orderStatusError(code: UpdateOrderStatusErrorCode, message: string): UpdateOrderStatusError {
  return Object.assign(new Error(message), { code });
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<UpdateOrderStatusResult> {
  const callNumber = ++updateSessionCount;
  const injectsFailure = callNumber % 7 === 0;
  const injectsSlowness = callNumber % 4 === 0;
  await delay(injectsFailure ? LATENCY_MS : injectsSlowness ? SLOW_LATENCY_MS : LATENCY_MS);

  const order = orderStore.find((candidate) => candidate.id === orderId);
  if (!order) {
    throw orderStatusError("not-found", `Order ${orderId} not found.`);
  }
  if (order.status === status) {
    throw orderStatusError("unchanged-status", `Order ${orderId} is already ${status}.`);
  }
  if (order.status === "cancelled") {
    throw orderStatusError("cancelled-order", `Order ${orderId} was cancelled and can no longer be updated.`);
  }

  // Durable write into the in-memory dataset; every later fetch sees the new status.
  order.status = status;

  return { order: { ...order } };
}
