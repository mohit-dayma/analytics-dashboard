import { Command } from "cmdk";
import {
  Check,
  Download,
  LayoutDashboard,
  Link,
  Moon,
  ReceiptText,
  RotateCcw,
  Sun,
  SunMoon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { fetchDashboardData } from "@/data/mock-api";
import type { DashboardData } from "@/data/types";
import { exportOrdersCsv } from "@/features/orders/csv-export";
import { filterOrdersByParams } from "@/features/orders/filter-orders";
import { useUiStore, type Theme } from "@/store/ui-store";

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: SunMoon },
];

const GROUP_CLASS =
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground";
const ITEM_CLASS =
  "flex cursor-pointer select-none items-center gap-x-2 rounded-lg px-3 py-2 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground";

export default function CommandPalette() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const commandOpen = useUiStore((s) => s.commandOpen);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const copyResetTimer = useRef<number>(undefined);
  const closeTimer = useRef<number>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(copyResetTimer.current);
      window.clearTimeout(closeTimer.current);
    },
    [],
  );

  function go(path: string) {
    navigate(path);
    setCommandOpen(false);
  }

  // Orders are range-independent, so any cached dashboard payload will do; only pay the
  // 300 ms fetch when the palette is used before any dashboard data was loaded.
  async function exportCsv() {
    const cachedOrders = queryClient
      .getQueryCache()
      .getAll()
      .map((query) => queryClient.getQueryData<DashboardData>(query.queryKey))
      .find((data) => data?.orders.length)
      ?.orders;
    const orders = cachedOrders ?? (await fetchDashboardData(30)).orders;
    const rows =
      location.pathname === "/orders"
        ? filterOrdersByParams(orders, searchParams)
        : orders;
    exportOrdersCsv(rows, "pulse-orders.csv");
    setCommandOpen(false);
  }

  function copyPageLink() {
    window.clearTimeout(copyResetTimer.current);
    window.clearTimeout(closeTimer.current);
    // Optimistic feedback; reverted if the write actually fails so a broken
    // clipboard never shows a fake success.
    setCopied(true);
    copyResetTimer.current = window.setTimeout(() => setCopied(false), 2000);
    closeTimer.current = window.setTimeout(() => setCommandOpen(false), 1200);
    void navigator.clipboard
      ?.writeText(window.location.href)
      .catch(() => setCopied(false));
  }

  return (
    <Command.Dialog
      open={commandOpen}
      onOpenChange={setCommandOpen}
      label="Command menu"
      loop
      overlayClassName="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
      contentClassName="fixed left-1/2 top-20 z-50 w-[420px] max-w-[90vw] -translate-x-1/2 rounded-xl border bg-popover p-2 shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
    >
      <Command.Input
        placeholder="Search commands…"
        aria-label="Search commands"
        className="h-10 w-full border-b bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
      />
      <Command.List className="max-h-72 overflow-y-auto overflow-x-hidden py-1">
        <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
          No results found.
        </Command.Empty>

        <Command.Group heading="Navigation" className={GROUP_CLASS}>
          <Command.Item
            onSelect={() => go("/")}
            keywords={["home", "dashboard"]}
            className={ITEM_CLASS}
          >
            <LayoutDashboard className="size-4" />
            Go to Overview
          </Command.Item>
          <Command.Item
            onSelect={() => go("/orders")}
            keywords={["table", "purchases"]}
            className={ITEM_CLASS}
          >
            <ReceiptText className="size-4" />
            Go to Orders
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Actions" className={GROUP_CLASS}>
          <Command.Item
            value="export-orders-csv"
            keywords={["csv", "download", "export"]}
            onSelect={() => void exportCsv()}
            className={ITEM_CLASS}
          >
            <Download className="size-4" />
            Export orders CSV
          </Command.Item>
          <Command.Item
            value="copy-page-link"
            keywords={["url", "share", "link"]}
            onSelect={copyPageLink}
            className={ITEM_CLASS}
          >
            <Link className="size-4" />
            Copy page link
            {copied && (
              <span className="ml-auto flex items-center gap-x-1 text-xs text-muted-foreground">
                <Check className="size-4" />
                Copied!
              </span>
            )}
          </Command.Item>
          <Command.Item
            value="reset-orders-filters"
            keywords={["clear", "filters"]}
            onSelect={() => go("/orders")}
            className={ITEM_CLASS}
          >
            <RotateCcw className="size-4" />
            Reset orders filters
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Appearance" className={GROUP_CLASS}>
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <Command.Item
              key={value}
              value={`theme-${value}`}
              keywords={["theme", "mode"]}
              onSelect={() => {
                setTheme(value);
                setCommandOpen(false);
              }}
              className={ITEM_CLASS}
            >
              <Icon className="size-4" />
              {label}
              {theme === value && <Check className="ml-auto size-4" />}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
