import { useEffect, useRef, type MouseEvent, type ReactNode, type SyntheticEvent } from "react";
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
import { nextStatuses, statusLabel, useUpdateOrderStatus } from "@/features/orders/use-update-order-status";
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

/**
 * Forward-only status transitions. Only the clicked button reports the pending
 * state ("Marking…"); every transition button is disabled while a mutation is
 * in flight. Success/failure toasts come from the mutation hook itself.
 */
function ChangeStatus({ order }: { order: Order }) {
  const mutation = useUpdateOrderStatus();
  const targets = nextStatuses(order.status);
  const isPending = mutation.isPending;
  const pendingStatus = isPending ? mutation.variables?.status : undefined;

  return (
    <section aria-label="Change status" className="mt-4">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Change status</h3>
      {targets.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No further transitions.</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {targets.map((target) => (
            <Button
              key={target}
              variant="outline"
              size="sm"
              disabled={isPending}
              aria-busy={pendingStatus === target || undefined}
              onClick={() => mutation.mutate({ orderId: order.id, status: target })}
            >
              {pendingStatus === target ? "Marking…" : `Mark ${statusLabel(target)}`}
            </Button>
          ))}
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Backdrop clicks land on the <dialog> element itself, while clicks inside
  // the panel land on child elements — treat an exact target match as backdrop.
  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) onClose();
  }

  // Escape fires `cancel`; preventDefault keeps the close routed through React
  // state (`onClose`) so `open` remains the single source of truth.
  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    onClose();
  }

  // `open` drives the imperative side effects only — the dialog element itself
  // stays mounted (a closed native dialog is display:none and out of the
  // accessibility tree). showModal() puts the panel in the top layer with
  // native focus trapping, and closing the dialog restores focus to whichever
  // element had it before it opened.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Focus the close button on open, as before. Native focus restoration on
      // close still points at the pre-open element because showModal() records
      // it before we move focus inside the panel.
      closeButtonRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const rows: DetailRow[] = order
    ? [
        { icon: User, label: "Customer", value: order.customer, truncate: true },
        { icon: Mail, label: "Email", value: order.email, truncate: true },
        { icon: Package, label: "Product", value: order.product, truncate: true },
        { icon: Globe, label: "Region", value: order.region, truncate: true },
        {
          icon: null,
          label: "Status",
          value: (
            <Badge variant="outline" className={statusBadge[order.status]}>
              {order.status}
            </Badge>
          ),
          truncate: true,
        },
        {
          icon: CircleDollarSign,
          label: "Total",
          value: <span className="font-medium tabular-nums">{formatCurrency(order.total)}</span>,
          truncate: true,
        },
        {
          icon: CalendarDays,
          label: "Created",
          truncate: false,
          value: (
            <span className="flex flex-wrap items-baseline gap-x-2">
              <span>{formatChartDate(order.createdAt)}</span>
              <span className="text-xs text-muted-foreground tabular-nums" title={order.createdAt}>
                {order.createdAt}
              </span>
            </span>
          ),
        },
      ]
    : [];

  return (
    <dialog
      ref={dialogRef}
      aria-label={order ? `Order ${order.id}` : undefined}
      onClick={handleBackdropClick}
      onCancel={handleCancel}
      onClose={onClose}
      className={cn(
        // Panel styling only — the dialog element IS the slide-over. The
        // backdrop comes from native ::backdrop via the backdrop: variant.
        "fixed inset-y-0 right-0 z-50 m-0 flex w-full max-w-md flex-col border-l bg-background shadow-xl",
        // Open/close styling follows the native `open` attribute state: closed
        // dialogs are display:none and irrelevant, so open values transition
        // from the closed values seeded via @starting-style.
        "hidden open:flex translate-x-full opacity-0 open:translate-x-0 open:opacity-100 starting:open:translate-x-full starting:open:opacity-0",
        // display/overlay transitions with discrete behavior keep the panel in
        // the top layer while the slide-out runs, so close animates too.
        "transition-[translate,opacity,display,overlay] duration-200 [transition-behavior:allow-discrete] motion-reduce:transition-none",
        "backdrop:bg-black/50",
      )}
    >
      {order && (
        <>
          <header className="flex items-start justify-between gap-4 border-b px-5 py-4">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold tracking-tight">{order.id}</h2>
              <Badge variant="outline" className={cn("mt-1.5", statusBadge[order.status])}>
                {order.status}
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
            <StatusTimeline status={order.status} />

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

            <ChangeStatus order={order} />
          </div>
        </>
      )}
    </dialog>
  );
}
