import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Kotak centang native (bekerja langsung dengan register) dengan label dan keterangan. */
export function CheckField({ id, label, hint, className, ...props }: ComponentProps<"input"> & { id: string; label: string; hint?: ReactNode }) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input id={id} type="checkbox" className="mt-0.5 size-4.5 shrink-0 accent-primary" aria-describedby={hint ? `${id}-hint` : undefined} {...props} />
      <div className="flex flex-col gap-0.5">
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        {hint && (
          <span id={`${id}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}

/** Kelompok field berjudul di form admin yang panjang. */
export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-4 border-t border-border pt-5 first:border-t-0 first:pt-0">
      <legend className="float-left mb-1 w-full">
        <span className="text-lg font-bold">{title}</span>
        {description && <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>}
      </legend>
      {children}
    </fieldset>
  );
}
