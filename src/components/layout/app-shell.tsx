import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import CommandPalette from "@/components/command-palette/command-palette";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import { useUiStore } from "@/store/ui-store";

export default function AppShell() {
  const location = useLocation();
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
    </div>
  );
}
