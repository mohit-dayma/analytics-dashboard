import type {
  DashboardData,
  Kpi,
  Order,
  OrderStatus,
  RevenuePoint,
  TrafficPoint,
} from "@/data/types";

// Scalar seed keeps the noise deterministic; only the calendar anchors to load time.
const SEED = 20260214;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Shared deterministic PRNG (0..1). Consumed in a fixed order at module load. */
export const rng = mulberry32(SEED);

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(rng() * list.length)];
}

const DAY_MS = 86_400_000;
const NOW = new Date();
const TODAY_UTC = Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth(), NOW.getUTCDate());

function isoDate(offsetDays = 0): string {
  return new Date(TODAY_UTC - offsetDays * DAY_MS).toISOString().slice(0, 10);
}

// Fictional but believable B2B customer pool: [company, billing email]
const CUSTOMERS: readonly [string, string][] = [
  ["Hartwell Media", "billing@hartwellmedia.com"],
  ["Bluecrest Analytics", "accounts@bluecrestanalytics.io"],
  ["Fernway Labs", "finance@fernwaylabs.dev"],
  ["Asterline Health", "ap@asterlinehealth.com"],
  ["Quarry Route Logistics", "billing@quarryroute.com"],
  ["Marlowe Publishing", "finance@marlowepublish.com"],
  ["Northgate Retail Group", "accounts@northgateretail.com"],
  ["Cobalt Freight", "ap@cobaltfreight.io"],
  ["Sablewater Estates", "billing@sablewater.com"],
  ["Ironleaf Manufacturing", "finance@ironleafmfg.com"],
  ["Pellworth Consulting", "invoices@pellworth.co.uk"],
  ["Vantage Grove Hotels", "ap@vantangrove.com"],
  ["Redhill Optics", "billing@redhilloptics.de"],
  ["Castellan Insurance", "accounts@castellaninsurance.com"],
  ["Meridian Fork", "ap@meridianfork.com"],
  ["Lakeshore Motors", "finance@lakeshoremotors.com"],
  ["Brightkind Foundation", "grants@brightkind.org"],
  ["Foxfield Education", "ap@foxfield.edu"],
  ["Dunmore & Vale", "billing@dunmorevale.com"],
  ["Aurelia Cosmetics", "orders@aureliabeauty.com"],
  ["Granite Peak Outfitters", "ap@granitepeak.com"],
  ["Wexler Property Group", "accounts@wexlerproperty.com"],
  ["Tidebrook Seafoods", "finance@tidebrook.com"],
  ["Vireo Cloud Systems", "ap@vireocloud.jp"],
];

// Product catalogue with per-seat price bands (USD); averages land near the ~$210 order mean.
const PRODUCTS: readonly { name: string; min: number; max: number }[] = [
  { name: "Pulse Onboarding", min: 65, max: 140 },
  { name: "Pulse Core", min: 100, max: 220 },
  { name: "Pulse Alerts", min: 120, max: 250 },
  { name: "Pulse Insights", min: 150, max: 320 },
  { name: "Pulse API Gateway", min: 190, max: 400 },
  { name: "Pulse Data Warehouse", min: 310, max: 640 },
];

const REGIONS = ["North America", "Europe", "APAC", "LATAM"] as const;

// Multiplicative weekday shape, Sun..Sat; the classic weekend dip.
const REVENUE_WEEKDAY = [0.86, 1.02, 1.06, 1.05, 1.03, 1.0, 0.9] as const;
const TRAFFIC_WEEKDAY = [0.78, 1.03, 1.07, 1.06, 1.04, 1.01, 0.82] as const;

const SERIES_DAYS = 90;

const revenueSeries: RevenuePoint[] = [];
const trafficSeries: TrafficPoint[] = [];

for (let i = 0; i < SERIES_DAYS; i++) {
  const date = new Date(TODAY_UTC + (i - (SERIES_DAYS - 1)) * DAY_MS);
  const iso = date.toISOString().slice(0, 10);
  const weekday = date.getUTCDay();
  const growth = i / (SERIES_DAYS - 1);

  // Upward trend (14k -> 34k/day) + weekly seasonality + noise.
  const revenue = Math.round(
    (14_000 + growth * 20_000) * REVENUE_WEEKDAY[weekday] * (0.95 + rng() * 0.12),
  );
  revenueSeries.push({
    date: iso,
    revenue,
    orders: Math.max(1, Math.round((revenue / 210) * (0.96 + rng() * 0.08))),
  });

  // Visits (24k -> 40k/day) follow the same trend/seasonality; signups are 4-9% of visits.
  const visits = Math.round(
    (24_000 + growth * 16_000) * TRAFFIC_WEEKDAY[weekday] * (0.94 + rng() * 0.12),
  );
  trafficSeries.push({
    date: iso,
    visits,
    signups: Math.round(visits * (0.04 + rng() * 0.05)),
  });
}

const sum = (points: { value: number }[]) => points.reduce((acc, p) => acc + p.value, 0);

const revenueLast = revenueSeries.slice(-30);
const revenuePrev = revenueSeries.slice(-60, -30);
const trafficLast = trafficSeries.slice(-30);
const trafficPrev = trafficSeries.slice(-60, -30);

const revenue30 = sum(revenueLast.map((p) => ({ value: p.revenue })));
const revenue30Prev = sum(revenuePrev.map((p) => ({ value: p.revenue })));
const orders30 = sum(revenueLast.map((p) => ({ value: p.orders })));
const orders30Prev = sum(revenuePrev.map((p) => ({ value: p.orders })));
const visits30 = sum(trafficLast.map((p) => ({ value: p.visits })));
const visits30Prev = sum(trafficPrev.map((p) => ({ value: p.visits })));
const signups30 = sum(trafficLast.map((p) => ({ value: p.signups })));
const signups30Prev = sum(trafficPrev.map((p) => ({ value: p.signups })));

const revenueDelta = (revenue30 - revenue30Prev) / revenue30Prev;
const ordersDelta = (orders30 - orders30Prev) / orders30Prev;
const visitsDelta = (visits30 - visits30Prev) / visits30Prev;

// Conversion value is a fraction (0.06 = 6%), matching the fractional delta convention.
const conversion = signups30 / visits30;
const conversionPrev = signups30Prev / visits30Prev;
const conversionDelta = (conversion - conversionPrev) / conversionPrev;

// Active users synthesized as a stable share (35-55%) of the 30-day visit pool.
const kpis: Kpi[] = [
  {
    label: "Total revenue",
    value: revenue30,
    delta: revenueDelta,
    format: "currency",
    spark: revenueSeries.slice(-14).map((p) => p.revenue),
  },
  {
    label: "Orders",
    value: orders30,
    delta: ordersDelta,
    format: "number",
    spark: revenueSeries.slice(-14).map((p) => p.orders),
  },
  {
    label: "Active users",
    value: Math.round(visits30 * (0.35 + rng() * 0.2)),
    delta: visitsDelta,
    format: "number",
    spark: trafficSeries.slice(-14).map((p) => p.visits),
  },
  {
    label: "Conversion rate",
    value: conversion,
    delta: conversionDelta,
    format: "percent",
    spark: trafficSeries.slice(-14).map((p) => p.signups / p.visits),
  },
];

// Order statuses skew by age: fresh orders are in flight, older ones settle to delivered.
function pickStatus(dayOffset: number): OrderStatus {
  const r = rng();
  if (dayOffset <= 1) {
    if (r < 0.3) return "pending";
    if (r < 0.65) return "processing";
    if (r < 0.85) return "shipped";
    return "delivered";
  }
  if (r < 0.5) return "delivered";
  if (r < 0.82) return "shipped";
  if (r < 0.95) return "processing";
  return "cancelled";
}

const ORDER_SPAN_DAYS = 21;
const MAX_ORDERS = 60;

const drafts: { offset: number; customer: [string, string]; product: (typeof PRODUCTS)[number] }[] = [];

// Iterate newest day first so the array is already sorted newest -> oldest.
for (let offset = 0; offset < ORDER_SPAN_DAYS; offset++) {
  const perDay = 2 + Math.floor(rng() * 3); // 2-4 orders per day
  for (let n = 0; n < perDay; n++) {
    drafts.push({ offset, customer: pick(CUSTOMERS), product: pick(PRODUCTS) });
  }
}

const usedIds = new Set<string>();
const orders: Order[] = drafts.slice(0, MAX_ORDERS).map((draft) => {
  let id: string;
  do {
    id = `ORD-${100_000 + Math.floor(rng() * 900_000)}`;
  } while (usedIds.has(id));
  usedIds.add(id);

  return {
    id,
    customer: draft.customer[0],
    email: draft.customer[1],
    product: draft.product.name,
    region: pick(REGIONS),
    status: pickStatus(draft.offset),
    // Two-decimal USD total inside the product's price band.
    total: Math.round((draft.product.min + rng() * (draft.product.max - draft.product.min)) * 100) / 100,
    createdAt: isoDate(draft.offset),
  };
});

export const dashboardData: DashboardData = {
  kpis,
  revenueSeries,
  trafficSeries,
  orders,
};
