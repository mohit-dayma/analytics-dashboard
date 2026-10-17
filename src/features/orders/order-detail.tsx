import { useEffect, useRef, type ReactNode } from "react";
import {
  CalendarDays,
  CircleDollarSign,
  Globe,
  Mail,
  Package,
  User,
  X,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Order, OrderStatus } from "@/data/types";
import { formatChartDate, formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusBadge: Record<OrderStatus, string> = {
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  shipped: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  processing: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  pending: "text-muted-foreground",
  cancelled: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
};

const lifecycle: OrderStatus[] = ["pending", "processing", "shipped", "delivered"];

/** Horizontal pending → processing → shipped → delivered stepper; cancelled renders all steps muted/dashed. */
function StatusTimeline({ status }: { status: OrderStatus }) {
  const cancelled = status === "cancelled";
  const currentIndex = lifecycle.indexOf(status);
  // Connector counts as traversed when it sits before-or-at the current lifecycle step.
  const traversed = (nextIndex: number) => nextIndex <= currentIndex;

  return (
    <section aria-label="Status timeline">
      <div className="flex items-start">
        {lifecycle.map((step, i) => {
          const done = !cancelled && i < currentIndex;
          const current = !cancelled && i === currentIndex;
          // Left/right connector halves; "invisible" fully hides the edge spacers,
          // including their dashed border in the cancelled state.
          const lineClass = (filled: boolean, edge: boolean) =>
            cn(
              "h-px flex-1",
              cancelled
                ? "border-t border-dashed border-border"
                : filled
                  ? "bg-[var(--chart-1)]"
                  : "bg-border",
              edge && "invisible",
            );
          return (
            <div key={step} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full items-center" aria-hidden="true">
                <span className={lineClass(i > 0 && traversed(i), i === 0)} />
                <span
                  className={cn(
                    "mx-0.5 size-3 shrink-0 rounded-full border-2",
                    done && "border-[var(--chart-1)] bg-[var(--chart-1)]",
                    current && "border-foreground bg-background ring-2 ring-foreground/25",
                    !done && !current && "border-border bg-muted-foreground/25",
                  )}
                />
                <span
                  className={lineClass(
                    i < lifecycle.length - 1 && traversed(i + 1),
                    i === lifecycle.length - 1,
                  )}
                />
              </div>
              <span
                className={cn(
                  "truncate text-center text-xs",
                  done || current ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
      {cancelled && (
        <div className="mt-3 flex items-center justify-end gap-1.5">
          <XCircle className="size-3.5 text-red-600 dark:text-red-400" aria-hidden="true" />
          <span className="text-xs font-medium text-red-600 dark:text-red-400">Cancelled</span>
        </div>
      )}
    </section>
  );
}

interface DetailRow {
  icon: typeof User | null;
  label: string;
  value: ReactNode;
  truncate: boolean;
}

export function OrderDetailPanel(props: {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}) {
  const { order, open, onClose } = props;
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // While open: Escape closes, focus moves into the panel, and closing restores
  // focus to whichever element had it before the panel opened.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  // The parent keeps `order` mounted while the panel slides out, so the panel
  // itself needs no retained copy — it simply renders nothing until the first
  // order is selected.
  if (!order) return null;
  const shownOrder = order;

  const rows: DetailRow[] = [
    { icon: User, label: "Customer", value: shownOrder.customer, truncate: true },
    { icon: Mail, label: "Email", value: shownOrder.email, truncate: true },
    { icon: Package, label: "Product", value: shownOrder.product, truncate: true },
    { icon: Globe, label: "Region", value: shownOrder.region, truncate: true },
    {
      icon: null,
      label: "Status",
      value: (
        <Badge variant="outline" className={statusBadge[shownOrder.status]}>
          {shownOrder.status}
        </Badge>
      ),
      truncate: true,
    },
    {
      icon: CircleDollarSign,
      label: "Total",
      value: <span className="font-medium tabular-nums">{formatCurrency(shownOrder.total)}</span>,
      truncate: true,
    },
    {
      icon: CalendarDays,
      label: "Created",
      truncate: false,
      value: (
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span>{formatChartDate(shownOrder.createdAt)}</span>
          <span className="text-xs text-muted-foreground tabular-nums" title={shownOrder.createdAt}>
            {shownOrder.createdAt}
          </span>
        </span>
      ),
    },
  ];

  return (
    <>
      {/* Backdrop stays mounted so it fades smoothly in both directions. */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close order details"
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 motion-reduce:transition-none ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Order ${shownOrder.id}`}
        inert={!open}
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l bg-background shadow-xl transition-[transform,opacity] duration-200 motion-reduce:transition-none ${
          open ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-full opacity-0"
        }`}
      >
        <header className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-tight">{shownOrder.id}</h2>
            <Badge variant="outline" className={cn("mt-1.5", statusBadge[shownOrder.status])}>
              {shownOrder.status}
            </Badge>
          </div>
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close order details"
            className="shrink-0"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <StatusTimeline status={shownOrder.status} />

          <dl className="mt-6 rounded-lg border">
            {rows.map(({ icon: Icon, label, value, truncate }) => (
              <div
                key={label}
                className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                <dt className="w-16 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </dt>
                <dd className={cn("min-w-0 flex-1 text-sm text-foreground", truncate && "truncate")}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>
    </>
  );
}
