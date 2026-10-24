import type { ReactNode } from "react";

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
    <div className="my-6 flex items-center gap-3 text-sm text-muted-foreground" aria-hidden="true">
      <span className="h-px flex-1 bg-border" />
      atau
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function FormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Memuat formulir">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
        </div>
      ))}
      <div className="h-12 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
