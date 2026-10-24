import { Menu, Moon, Search, Sun } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { useUiStore } from "@/store/ui-store";

// Show the platform-idiomatic shortcut hint in the fake search field.
const isMac = /Mac|iPhone|iPad/.test(navigator.platform);

export default function Topbar() {
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);
  const openCommand = useUiStore((s) => s.openCommand);
  const setTheme = useUiStore((s) => s.setTheme);

  // If the theme is "system", the first click commits to the currently resolved scheme.
  function toggleTheme() {
    setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark");
  }

  return (
    // Negative margins let the header bleed across main's horizontal padding.
    <header className="sticky top-0 z-30 -mx-4 mb-6 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation menu"
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      <button
        type="button"
        onClick={openCommand}
        className="hidden h-9 w-full max-w-xs items-center gap-2 rounded-lg border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted sm:flex"
        aria-label="Open command palette"
      >
        <span>Search…</span>
        <Kbd className="ml-auto">{isMac ? "⌘ K" : "Ctrl K"}</Kbd>
      </button>
      <button
        type="button"
        onClick={openCommand}
        aria-label="Search"
        className="flex size-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:text-foreground sm:hidden"
      >
        <Search className="size-4" />
      </button>

      <div className="flex-1" />

      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        title="Toggle theme"
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
      >
        <Sun className="size-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
      </button>
    </header>
  );
}
