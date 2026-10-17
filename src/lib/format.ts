const currencyFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const numberFmt = new Intl.NumberFormat("en-US");
const percentFmt = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });
const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export function formatCurrency(value: number): string {
  return currencyFmt.format(value);
}

export function formatNumber(value: number): string {
  return numberFmt.format(value);
}

/** Percent KPIs store "3.4" to mean 3.4%. */
export function formatPercent(value: number): string {
  return percentFmt.format(value / 100);
}

/** Delta is a fraction (0.142 -> "+14.2%"). Uses U+2212 for negatives, not a hyphen. */
export function formatDelta(delta: number): string {
  return `${delta < 0 ? "\u2212" : "+"}${percentFmt.format(Math.abs(delta))}`;
}

/** ISO "YYYY-MM-DD" -> "Mar 12"; parsed as local midnight to avoid TZ day drift. */
export function formatChartDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return dateFmt.format(new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}
