import { create } from "zustand";

export type Theme = "light" | "dark" | "system";

const THEME_KEY = "pulse-theme";

function storedTheme(): Theme {
  const raw = localStorage.getItem(THEME_KEY);
  return raw === "light" || raw === "dark" ? raw : "system";
}

function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// The pre-paint flash is prevented by the inline script in index.html / main.tsx;
// the store only keeps the class in sync for later changes.
function applyThemeClass(theme: Theme): void {
  const dark = theme === "dark" || (theme === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
}

interface UiState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  openCommand: () => void;
  closeCommand: () => void;
  toggleCommand: () => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  closeMobileNav: () => void;
}

export const useUiStore = create<UiState>()((set, get) => ({
  theme: storedTheme(),
  setTheme: (theme) => {
    localStorage.setItem(THEME_KEY, theme);
    applyThemeClass(theme);
    set({ theme });
  },
  commandOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  openCommand: () => set({ commandOpen: true }),
  closeCommand: () => set({ commandOpen: false }),
  toggleCommand: () => set({ commandOpen: !get().commandOpen }),
  mobileNavOpen: false,
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  closeMobileNav: () => set({ mobileNavOpen: false }),
}));

// Idempotent one-time sync in case the pre-paint script did not run (e.g. hot module reload).
applyThemeClass(useUiStore.getState().theme);
