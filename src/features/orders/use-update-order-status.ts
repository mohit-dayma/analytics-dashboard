import { useEffect, useRef } from "react";
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
  type UseMutateFunction,
} from "@tanstack/react-query";
import { toast } from "sonner";
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

type RetryMutate = UseMutateFunction<
  UpdateOrderStatusResult,
  Error,
  UpdateOrderStatusVariables,
  UpdateOrderStatusContext
>;

/**
 * Optimistic pattern (interview point):
 * 1. onMutate cancels in-flight dashboard refetches, snapshots every cached
 *    ["dashboard", N] entry, then rewrites the matching order's status — the
 *    variables become the UI truth before any server round-trip lands.
 * 2. onError rolls the snapshots back (the old status reappears) and surfaces a
 *    loud, actionable retry toast; successes stay whisper-quiet.
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
  // The Retry action in the error toast re-enters this same mutation. `mutate`
  // gets a stable identity only after useMutation returns, so it reaches the
  // toast options through a ref synced on the next effect run.
  const mutateRef = useRef<RetryMutate | null>(null);

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

    onError(error, variables, context) {
      // Roll back every entry we touched, then make the failure loud + actionable.
      for (const entry of context?.snapshot ?? []) {
        queryClient.setQueryData(entry.key, entry.data);
      }
      toast.error(`Couldn't update ${variables.orderId}`, {
        description: error.message,
        action: {
          label: "Retry",
          // The mock faults deterministically, so a retry can still hit the
          // slow/failing path — but eventually succeeds, like real flaky backends.
          onClick: () => void mutateRef.current?.({ orderId: variables.orderId, status: variables.status }),
        },
      });
    },

    // Quiet confirmation; the slide-over + table already show the new status.
    onSuccess({ order }) {
      toast.success(`${order.id} marked ${statusLabel(order.status)}`);
    },

    onSettled() {
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  useEffect(() => {
    mutateRef.current = mutation.mutate;
  });

  return mutation;
}
