import { Command } from "cmdk";
import { Check, LayoutDashboard, Moon, ReceiptText, Sun, SunMoon } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const commandOpen = useUiStore((s) => s.commandOpen);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  function go(path: string) {
    navigate(path);
    setCommandOpen(false);
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
