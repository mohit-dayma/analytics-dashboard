import { QueryClient } from "@tanstack/react-query";

// One shared client for the whole app: a single cache means revisited pages
// and sibling views reuse the same queries instead of refetching.
//
// Tuned for the (mock) API layer, which answers after ~300ms per call:
// - staleTime 5min keeps freshly loaded data "warm", so switching date ranges
//   or navigating back does not re-show loading skeletons while a refetch runs.
// - gcTime 30min lets unmounted pages keep their data around, so a quick
//   back-and-forth restores instantly.
// - Focusing the window is not a meaningful "event" here, so no refetch on it.
// - Two retries with exponential backoff (300ms, 600ms, capped at 3s) ride out
//   transient hiccups without stacking long waits in front of the user.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: (attempt) => Math.min(300 * 2 ** attempt, 3_000),
    },
  },
});
