import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// shadcn/ui convention: clsx for conditionals, tailwind-merge to resolve
// conflicting utility classes so later props win.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
