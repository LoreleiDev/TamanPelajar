import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Select native bergaya input shadcn: bekerja langsung dengan register() React Hook Form. */
export function NativeSelect({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <span className="relative block">
      <select
        {...props}
        className={cn(
          "h-10 w-full appearance-none rounded-lg border border-input bg-background pr-9 pl-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          className,
        )}
      >
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </span>
  );
}
