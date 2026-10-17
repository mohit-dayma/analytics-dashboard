import type { Kpi, RangeDays, RevenuePoint, TrafficPoint } from "@/data/types";

// Windowed derivations shared by seed.ts (30-day module-load snapshot) and
// mock-api.ts (arbitrary range payloads). Kept pure over the seeded series so
// every payload stays deterministic per session: no rng consumption here.

// Sparklines always show the last-14-days shape of the relevant metric.
const METRIC_WINDOW_DAYS = 14;

const sum = <T>(points: readonly T[], value: (point: T) => number): number =>
  points.reduce((acc, point) => acc + value(point), 0);

// Deltas stay fractional (0.14 = +14%); 0 when no comparable previous window
// exists (rangeDays = 90 exhausts the seeded history).
const fractionalDelta = (current: number, previous: number): number =>
  previous > 0 ? (current - previous) / previous : 0;

// Validates the runtime value behind the RangeDays union (defensive backend seam).
export function normalizeRangeDays(rangeDays: number): RangeDays {
  if (rangeDays === 7 || rangeDays === 30 || rangeDays === 90) {
    return rangeDays;
  }
  throw new Error(`Unsupported rangeDays ${rangeDays}; expected 7, 30 or 90.`);
}

/** The `rangeDays`-length window immediately preceding the current window. */
function previousWindow<T>(series: readonly T[], rangeDays: RangeDays): T[] {
  return series.slice(-2 * rangeDays, -rangeDays);
}

/** The 4 KPIs: last `rangeDays` vs the previous equal-length window. */
export function buildKpis(
  rangeDays: RangeDays,
  revenueSeries: readonly RevenuePoint[],
  trafficSeries: readonly TrafficPoint[],
  activeUserShare: number,
): Kpi[] {
  const revenue = revenueSeries.slice(-rangeDays);
  const revenuePrev = previousWindow(revenueSeries, rangeDays);
  const traffic = trafficSeries.slice(-rangeDays);
  const trafficPrev = previousWindow(trafficSeries, rangeDays);

  const revenueTotal = sum(revenue, (p) => p.revenue);
  const revenueTotalPrev = sum(revenuePrev, (p) => p.revenue);
  const ordersTotal = sum(revenue, (p) => p.orders);
  const ordersTotalPrev = sum(revenuePrev, (p) => p.orders);
  const visitsTotal = sum(traffic, (p) => p.visits);
  const visitsTotalPrev = sum(trafficPrev, (p) => p.visits);
  const signupsTotal = sum(traffic, (p) => p.signups);
  const signupsTotalPrev = sum(trafficPrev, (p) => p.signups);

  // Conversion value is a fraction (0.06 = 6%), matching the fractional delta convention.
  const conversion = signupsTotal / visitsTotal;
  const conversionPrev = signupsTotalPrev / visitsTotalPrev;

  return [
    {
      label: "Total revenue",
      value: revenueTotal,
      delta: fractionalDelta(revenueTotal, revenueTotalPrev),
      format: "currency",
      spark: revenueSeries.slice(-METRIC_WINDOW_DAYS).map((p) => p.revenue),
    },
    {
      label: "Orders",
      value: ordersTotal,
      delta: fractionalDelta(ordersTotal, ordersTotalPrev),
      format: "number",
      spark: revenueSeries.slice(-METRIC_WINDOW_DAYS).map((p) => p.orders),
    },
    {
      label: "Active users",
      value: Math.round(visitsTotal * activeUserShare),
      delta: fractionalDelta(visitsTotal, visitsTotalPrev),
      format: "number",
      spark: trafficSeries.slice(-METRIC_WINDOW_DAYS).map((p) => p.visits),
    },
    {
      label: "Conversion rate",
      value: conversion,
      delta: fractionalDelta(conversion, conversionPrev),
      format: "percent",
      spark: trafficSeries.slice(-METRIC_WINDOW_DAYS).map((p) => p.signups / p.visits),
    },
  ];
}

/** Compare slices for the previous window; null when 2 * rangeDays exceeds the seeded history. */
export function buildCompareSeries(
  rangeDays: RangeDays,
  revenueSeries: readonly RevenuePoint[],
  trafficSeries: readonly TrafficPoint[],
): {
  revenue: RevenuePoint[] | null;
  traffic: TrafficPoint[] | null;
} {
  if (2 * rangeDays > revenueSeries.length) {
    return { revenue: null, traffic: null };
  }
  return {
    revenue: previousWindow(revenueSeries, rangeDays).map((point) => ({ ...point })),
    traffic: previousWindow(trafficSeries, rangeDays).map((point) => ({ ...point })),
  };
}
