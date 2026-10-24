import type { ReactNode } from "react";

<<<<<<< HEAD
import { Skeleton } from "@/components/ui/skeleton";

=======
>>>>>>> aff4f2773b8df2b079ffefbc949056eb2b7437cd
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
<<<<<<< HEAD
    <p className="my-5 text-center text-sm text-muted-foreground" aria-hidden="true">
      atau dengan email
    </p>
=======
    <div className="my-6 flex items-center gap-3 text-sm text-muted-foreground" aria-hidden="true">
      <span className="h-px flex-1 bg-border" />
      atau
      <span className="h-px flex-1 bg-border" />
    </div>
>>>>>>> aff4f2773b8df2b079ffefbc949056eb2b7437cd
  );
}

export function FormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Memuat formulir">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
<<<<<<< HEAD
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-12 rounded-lg" />
=======
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
        </div>
      ))}
      <div className="h-12 animate-pulse rounded-lg bg-muted" />
>>>>>>> aff4f2773b8df2b079ffefbc949056eb2b7437cd
    </div>
  );
}
