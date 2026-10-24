import { CircleCheck } from "lucide-react";

import { cn } from "@/lib/utils";

/** Daftar keunggulan dengan centang dalam lingkaran, seperti tagline di logo. */
export function CheckList({
  items,
  tone = "default",
  className,
}: {
  items: string[];
  tone?: "default" | "inverse";
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-col gap-2.5", className)}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <CircleCheck
            aria-hidden="true"
            strokeWidth={2}
            className={cn("mt-0.5 size-5 shrink-0", tone === "inverse" ? "text-white" : "text-primary")}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
