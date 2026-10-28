import type { ReactNode } from "react";

import { SproutLoader } from "@/components/shared/ornaments";
import { Skeleton } from "@/components/ui/skeleton";

/** Judul halaman dashboard: padat, tanpa dekorasi. */
export function DashboardHeading({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="text-heading">{title}</h1>
        {children && <p className="text-muted-foreground">{children}</p>}
      </div>
      {action}
    </header>
  );
}

export function DashboardSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  const id = `bagian-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={id} className="text-lg font-bold">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Deretan angka ringkas (bukan kartu dekoratif). */
export function StatRow({ items }: { items: { label: string; value: ReactNode; hint?: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl bg-secondary p-5 md:grid-cols-4">
      {items.map((i) => (
        <div key={i.label} className="flex flex-col gap-0.5">
          <dt className="text-sm text-muted-foreground">{i.label}</dt>
          <dd className="text-2xl font-extrabold tracking-tight tabular-nums">{i.value}</dd>
          {i.hint && <dd className="text-sm text-muted-foreground">{i.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Memuat">
      <SproutLoader />
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-24 rounded-xl" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </div>
  );
}
