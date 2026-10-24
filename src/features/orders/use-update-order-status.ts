import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { updateOrderStatus } from "@/data/mock-api";
import type { UpdateOrderStatusResult } from "@/data/mock-api";
import type { DashboardData, OrderStatus } from "@/data/types";

export interface UpdateOrderStatusVariables {
  orderId: string;
  status: OrderStatus;
}

/**
 * Forward-only transition map. The mock validates the same rules server-side
 * (same-status and cancelled→anything reject), so the UI only ever offers
 * transitions from this map. Terminal states map to [].
 */
const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

/** Allowed next statuses for `status` (forward transitions only). */
export function nextStatuses(status: OrderStatus): OrderStatus[] {
  return [...TRANSITIONS[status]];
}

/** Natural label casing for toasts/buttons: "shipped" → "Shipped". */
export function statusLabel(status: OrderStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/** One cached ["dashboard", N] entry with its key, so onError can restore it verbatim. */
interface DashboardSnapshotEntry {
  key: readonly unknown[];
  data: DashboardData;
}

interface UpdateOrderStatusContext {
  snapshot: DashboardSnapshotEntry[];
}

/**
 * Optimistic pattern (interview point):
 * 1. onMutate cancels in-flight dashboard refetches, snapshots every cached
 *    ["dashboard", N] entry, then rewrites the matching order's status — the
 *    variables become the UI truth before any server round-trip lands.
 * 2. onError rolls the snapshots back (the old status reappears); the failure
 *    itself is surfaced INLINE by the caller (ChangeStatus) with a live
 *    Retry — the only mutator lives inside the slide-over, and a native
 *    modal dialog makes everything outside its subtree inert, so toast
 *    actions would be visible-but-unclickable exactly when needed.
 * 3. onSettled invalidates ["dashboard"] so a refetch always reconciles the
 *    cache with server truth — optimism is only ever a rendering shortcut, and
 *    a retried mutation legitimately re-enters onMutate to flip the status.
 */
export function useUpdateOrderStatus(): UseMutationResult<
  UpdateOrderStatusResult,
  Error,
  UpdateOrderStatusVariables,
  UpdateOrderStatusContext
> {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ orderId, status }: UpdateOrderStatusVariables) => updateOrderStatus(orderId, status),

    async onMutate({ orderId, status }: UpdateOrderStatusVariables): Promise<UpdateOrderStatusContext> {
      // Stop active/refetching ["dashboard", N] queries so a racing response
      // can't overwrite the optimistic write that follows.
      await queryClient.cancelQueries({ queryKey: ["dashboard"] });

      // Snapshot every cached dashboard entry that holds the order list.
      // The key shape is ["dashboard", RangeDays]; a length-2 check keeps the
      // map range-agnostic (7/30/90 all roll back) without importing RangeDays.
      const snapshot: DashboardSnapshotEntry[] = [];
      for (const query of queryClient.getQueryCache().getAll()) {
        if (query.queryKey[0] !== "dashboard" || query.queryKey.length !== 2) continue;
        const data = query.state.data as DashboardData | undefined;
        if (!data || !Array.isArray(data.orders)) continue;

        snapshot.push({ key: query.queryKey, data });
        const orders = data.orders.map((order) =>
          order.id === orderId ? { ...order, status } : order,
        );
        queryClient.setQueryData(query.queryKey, { ...data, orders });
      }

      return { snapshot };
    },

    onError(_error, _variables, context) {
      // Roll back every entry we touched; the caller surfaces the failure
      // inline (message + Retry) where its buttons are actually clickable.
      for (const entry of context?.snapshot ?? []) {
        queryClient.setQueryData(entry.key, entry.data);
      }
    },

    onSettled() {
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return mutation;
}
