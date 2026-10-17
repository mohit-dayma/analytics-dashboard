import type { RevenuePoint, TrafficPoint } from "@/data/types";

/** Tick/label defaults shared by all charts for a consistent look. */
export const axisTick = { fill: "var(--muted-foreground)", fontSize: 12 } as const;

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});
const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** Y-axis tick formatter: "$12.3K". */
export function formatCompactCurrency(value: number): string {
  return compactCurrency.format(value);
}

/** Y-axis tick formatter for counts: "12.3K". */
export function formatCompactNumber(value: number): string {
  return compactNumber.format(value);
}

/**
 * Period-over-period alignment: the compare series covers an equal-length window
 * ending the day BEFORE the current window's first day, so it is laid over the
 * chart by SLOT index (compare[i] sits on the current window's i-th x position),
 * not by its own real dates. That keeps the x domain untouched — the standard
 * PoP visual convention. Mismatches are handled defensively only: compare is
 * sliced to the current length, and any slot the (shorter) compare series does
 * not cover becomes `undefined`, which simply ends the dashed line early.
 */
function alignSlots<T extends { date: string }>(
  data: readonly T[],
  compare: readonly T[] | null | undefined,
  pick: (point: T) => number,
): Array<T & { previous?: number }> {
  if (!compare?.length) return data as Array<T & { previous?: number }>;
  const aligned = compare.slice(0, data.length);
  return data.map((point, i) => {
    const prev = aligned[i];
    return { ...point, previous: prev === undefined ? undefined : pick(prev) };
  });
}

/** Merges the slot-aligned previous revenue series into chart data under `previous`. */
export function revenueWithCompare(
  data: readonly RevenuePoint[],
  compare?: RevenuePoint[] | null,
): Array<RevenuePoint & { previous?: number }> {
  return alignSlots(data, compare, (point) => point.revenue);
}

/**
 * Merges the slot-aligned previous visits series into chart data under `previous`.
 * Visits is the single compared metric on purpose: one muted dashed line reads
 * quieter and cleaner than two competing with the live series.
 */
export function trafficWithCompare(
  data: readonly TrafficPoint[],
  compare?: TrafficPoint[] | null,
): Array<TrafficPoint & { previous?: number }> {
  return alignSlots(data, compare, (point) => point.visits);
}
