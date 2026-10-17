import * as React from "react";

import { cn } from "@/lib/utils";

// Renders text as a keyboard key, e.g. <Kbd>⌘</Kbd><Kbd>K</Kbd> in the command
// palette hint. The faux shadow under the border sells the "key cap" look.
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "bg-muted text-muted-foreground font-mono inline-flex h-5 min-w-5 select-none items-center justify-center gap-1 rounded-sm border px-1 text-[0.65rem] font-medium leading-none shadow-[0_1.5px_0_0_var(--color-border)] [&_svg:not([class*='size-'])]:size-3",
        className,
      )}
      {...props}
    />
  );
}

export { Kbd };
