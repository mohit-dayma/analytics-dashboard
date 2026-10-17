export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

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
  delta: number;   // fractional change vs previous period, e.g. 0.14 = +14%
  format: "currency" | "number" | "percent";
  spark: number[]; // last-14-day shape for the hand-built sparkline
}

export interface DashboardData {
  kpis: Kpi[];                   // exactly 4: Total revenue (currency), Orders (number), Active users (number), Conversion rate (percent)
  revenueSeries: RevenuePoint[]; // 90 days, ascending by date
  trafficSeries: TrafficPoint[]; // 90 days, ascending by date
  orders: Order[];               // ~60 most recent orders, newest first
}
