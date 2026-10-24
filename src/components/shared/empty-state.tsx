import type { ReactNode } from "react";

import { SproutMark } from "@/components/shared/ornaments";
import { cn } from "@/lib/utils";

/** Keadaan kosong: tunas, pesan yang menjelaskan, dan aksi berikutnya (P.2.3). */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center",
        className,
      )}
    >
      <SproutMark className="size-10 opacity-80" />
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
