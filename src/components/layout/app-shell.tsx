import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import CommandPalette from "@/components/command-palette/command-palette";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import { useUiStore } from "@/store/ui-store";

/**
 * Sonner toasts must stay visible and clickable while a native `<dialog>` is
 * open: `showModal()` promotes the dialog to the CSS top layer, which paints
 * above every ordinary fixed/`z-index` node. Housing the Toaster in a
 * `popover="manual"` element puts it in that same top layer.
 *
 * Top layer paint order is insertion order, so the popover is shown lazily on
 * the first toast and re-promoted whenever sonner adds a toast node — the
 * latest entry outranks a dialog that was shown earlier. The host itself is a
 * zero-size element; sonner's `<ol data-sonner-toaster>` is the fixed-position
 * surface, so only the painted toasts ever hit-test.
 *
 * Falls back to a plain render where the Popover API is unavailable.
 */
function TopLayerToaster({ theme }: { theme: "light" | "dark" | "system" | undefined }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host || typeof host.showPopover !== "function") return;

    const observer = new MutationObserver(() => {
      // Synchronous hide/show swap re-inserts the host after the dialog in
      // top-layer order; since both happen before the next paint, the swap
      // is not visible.
      host.hidePopover();
      host.showPopover();
    });
    observer.observe(host, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (typeof host.hidePopover === "function") host.hidePopover();
    };
  }, []);

  return (
    <div ref={ref} popover="manual" className="size-0 p-0">
      <Toaster position="bottom-right" theme={theme} />
    </div>
  );
}

export default function AppShell() {
  const location = useLocation();
  const theme = useUiStore((s) => s.theme);
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const closeMobileNav = useUiStore((s) => s.closeMobileNav);

  // Close the mobile drawer on every route change.
  useEffect(closeMobileNav, [location.pathname, closeMobileNav]);

  // Global shortcuts: Cmd/Ctrl+K opens the command palette; Escape backs out of the drawer.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        useUiStore.getState().openCommand();
      } else if (event.key === "Escape" && useUiStore.getState().mobileNavOpen) {
        useUiStore.getState().closeMobileNav();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="min-h-svh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-background lg:flex">
        <Sidebar />
      </aside>

      {/* Mobile drawer: backdrop + panel stay mounted so both transition smoothly */}
      <button
        type="button"
        onClick={closeMobileNav}
        aria-label="Close navigation menu"
        aria-hidden={!mobileNavOpen}
        tabIndex={mobileNavOpen ? 0 : -1}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden ${
          mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        inert={!mobileNavOpen}
        aria-hidden={!mobileNavOpen}
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r bg-background shadow-xl transition-transform duration-200 lg:hidden ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar showClose onNavigate={closeMobileNav} />
      </aside>

      <div className="lg:pl-60">
        <main className="mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8">
          <Topbar />
          <Outlet />
        </main>
      </div>

      <CommandPalette />

      {/* Sonner's <ol> is position:fixed viewport-anchored, so placement here
          is irrelevant; TopLayerToaster hoists it into the CSS top layer so
          toasts stay visible/clickable over native modal dialogs. */}
      <TopLayerToaster theme={theme} />
    </div>
  );
}
