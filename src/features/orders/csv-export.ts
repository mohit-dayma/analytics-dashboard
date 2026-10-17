import type { Order } from "@/data/types";

/*
 * Hand-rolled CSV export (no dependencies).
 *
 * - RFC-4180 escaping: fields containing a comma, double-quote, CR or LF are
 *   wrapped in double quotes and inner quotes are doubled ("") — otherwise
 *   customer/product names like "Smith, John" would corrupt row alignment in
 *   spreadsheet apps.
 * - UTF-8 BOM: precedes the payload so Excel detects the file as UTF-8 and
 *   renders non-ASCII names/emails correctly instead of mojibake.
 */

const CSV_HEADERS = ["id", "customer", "email", "product", "region", "status", "total", "createdAt"] as const;

function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function orderToCsvRow(order: Order): string {
  return [
    order.id,
    order.customer,
    order.email,
    order.product,
    order.region,
    order.status,
    order.total.toFixed(2),
    order.createdAt,
  ]
    .map(escapeCsvField)
    .join(",");
}

export function exportOrdersCsv(rows: Order[], filename: string): void {
  const csv = "\uFEFF" + [CSV_HEADERS.join(","), ...rows.map(orderToCsvRow)].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  // Revoke asynchronously so the download has started before the URL dies.
  setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 0);
}
