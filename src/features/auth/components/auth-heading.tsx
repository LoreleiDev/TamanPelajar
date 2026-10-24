import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";

/** Judul dan pengantar halaman autentikasi. */
export function AuthHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-2">
      <h1 className="text-title text-primary">{title}</h1>
      {children && <div className="text-lead text-muted-foreground">{children}</div>}
    </div>
  );
}

export function OrDivider() {
  return (
    <p className="my-5 text-center text-sm text-muted-foreground" aria-hidden="true">
      atau dengan email
    </p>
  );
}

export function FormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Memuat formulir">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-12 rounded-lg" />
    </div>
  );
}
