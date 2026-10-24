import { CircleCheck, ClipboardCheck, FileText, Lock, PlayCircle } from "lucide-react";

import type { LessonAccess } from "@/lib/access-rules";
import { cn } from "@/lib/utils";

/**
 * Ikon status materi di kurikulum (G.1): selesai, terkunci, atau jenis materi. Status
 * selalu disertai teks tersembunyi untuk pembaca layar, bukan hanya ikon atau warna.
 */
export function LessonStatusIcon({
  type,
  access,
  completed,
  className,
}: {
  type: string;
  access: LessonAccess;
  completed: boolean;
  className?: string;
}) {
  const cls = cn("size-4.5 shrink-0", className);
  if (completed) {
    return (
      <>
        <CircleCheck aria-hidden="true" className={cn(cls, "text-success")} />
        <span className="sr-only">Selesai: </span>
      </>
    );
  }
  if (access === "perlu-langganan" || access === "terkunci-urutan") {
    return (
      <>
        <Lock aria-hidden="true" className={cn(cls, "text-muted-foreground")} />
        <span className="sr-only">Terkunci: </span>
      </>
    );
  }
  const Icon = type === "KUIS" ? ClipboardCheck : type === "PDF" || type === "TEKS" ? FileText : PlayCircle;
  return <Icon aria-hidden="true" className={cn(cls, "text-primary")} />;
}
