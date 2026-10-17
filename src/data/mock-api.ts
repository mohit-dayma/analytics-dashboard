import type { DashboardData } from "@/data/types";
import { dashboardData } from "@/data/seed";

// Simulates real network latency so the UI genuinely exercises loading/suspense patterns.
const LATENCY_MS = 300;

// Single seam to swap for a real backend: reimplement fetchDashboardData against an API,
// keep the DashboardData contract, and everything else in the app stays unchanged.
export async function fetchDashboardData(): Promise<DashboardData> {
  await new Promise<void>((resolve) => setTimeout(resolve, LATENCY_MS));
  return dashboardData;
}
