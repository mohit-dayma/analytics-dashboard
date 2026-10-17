import { NavLink } from "react-router-dom";
import { LayoutDashboard, ReceiptText, X } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/orders", label: "Orders", icon: ReceiptText, end: false },
] as const;

// Heartbeat zigzag in a rounded square; crisp at 24px in the sidebar and 16px in the drawer.
function Logomark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="6" className="fill-primary" />
      <polyline
        points="5,12 9,12 11,7.5 13,16.5 15,12 19,12"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary-foreground"
      />
    </svg>
  );
}

interface SidebarProps {
  /** Called after nav clicks so a mobile drawer can close itself. */
  onNavigate?: () => void;
  /** Renders an explicit close button for touch users of the mobile drawer. */
  showClose?: boolean;
}

export default function Sidebar({ onNavigate, showClose = false }: SidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <NavLink to="/" onClick={onNavigate} className="flex items-center gap-x-2">
          <Logomark />
          <span className="text-base font-semibold tracking-tight">Pulse</span>
        </NavLink>
        {showClose && (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Close menu"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Main navigation">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }: { isActive: boolean }) =>
              `flex h-10 items-center gap-x-2 rounded-lg px-3 text-sm font-medium transition-colors ${
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t px-4 py-3 text-[11px] leading-snug text-muted-foreground">
        Demo data — replaces a real API
      </div>
    </div>
  );
}
