export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

/** Chart/KPI window lengths the dashboard supports. */
export type RangeDays = 7 | 30 | 90;

export interface Order {
  id: string;
  customer: string;
  email: string;
  product: string;
  region: string;
  status: OrderStatus;
  total: number;      // USD
  createdAt: string;  // ISO date "YYYY-MM-DD"
}

export interface RevenuePoint {
  date: string;    // ISO "YYYY-MM-DD"
  revenue: number; // USD per day
  orders: number;  // orders per day
}

export interface TrafficPoint {
  date: string;   // ISO "YYYY-MM-DD"
  visits: number;
  signups: number;
}

export interface Kpi {
  label: string;
  value: number;
  delta: number | null; // fractional change vs previous period (0.14 = +14%); null = no previous window to compare (90d)
  format: "currency" | "number" | "percent";
  spark: number[]; // last-14-day shape for the hand-built sparkline
}

export interface DashboardData {
  kpis: Kpi[]; // exactly 4: Total revenue (currency), Orders (number), Active users (number), Conversion rate (percent)
  rangeDays: RangeDays; // the range this payload's kpis were derived for
  revenueSeries: RevenuePoint[]; // FULL 90 days, ascending by date (charts slice client-side using rangeDays)
  compareRevenueSeries: RevenuePoint[] | null; // previous equal-length window (rangeDays points); null when unavailable (rangeDays = 90)
  trafficSeries: TrafficPoint[]; // FULL 90 days, ascending by date
  compareTrafficSeries: TrafficPoint[] | null; // previous equal-length window (rangeDays points); null when unavailable (rangeDays = 90)
  orders: Order[]; // all 60 orders, newest first
}
