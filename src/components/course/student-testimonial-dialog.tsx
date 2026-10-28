"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { SproutMark } from "@/components/shared/ornaments";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { kirimTestimoni } from "@/features/course/my-courses-actions";
import { studentTestimonialSchema } from "@/features/course/my-courses-schema";

// Testimoni siswa setelah menyelesaikan satu kelas 100% (revisi RMED). `autoOpen` memunculkan
// popup sekali; "Nanti saja" disimpan di browser agar popup tidak muncul lagi untuk kelas itu.

const dismissKey = (courseId: string) => `tp:testimoni-ditunda:${courseId}`;

function wasDismissed(courseId: string) {
  try {
    return window.localStorage.getItem(dismissKey(courseId)) === "1";
  } catch {
    return false;
  }
}

export function StudentTestimonialDialog({
  courseId,
  courseTitle,
  trigger,
  autoOpen = false,
}: {
  courseId: string;
  courseTitle: string;
  trigger?: ReactNode;
  autoOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<{ opening?: string; body?: string; form?: string }>({});
  const [pending, start] = useTransition();

  useEffect(() => {
    // Dibuka setelah hydration agar tidak terjadi mismatch dengan HTML server.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keputusan bergantung pada localStorage
    if (autoOpen && !wasDismissed(courseId)) setOpen(true);
  }, [autoOpen, courseId]);

  const later = () => {
    try {
      window.localStorage.setItem(dismissKey(courseId), "1");
    } catch {
      // Penyimpanan browser tidak tersedia; popup mungkin muncul lagi.
    }
    setOpen(false);
  };

  const submit = () => {
    const parsed = studentTestimonialSchema.safeParse({ courseId, opening, body });
    if (!parsed.success) {
      const e: typeof errors = {};
      for (const issue of parsed.error.issues) e[issue.path[0] as "opening" | "body"] ??= issue.message;
      return setErrors(e);
    }
    setErrors({});
    start(async () => {
      const r = await kirimTestimoni({ courseId, opening, body });
      if (!r.ok) {
        setErrors({ opening: r.fieldErrors?.opening, body: r.fieldErrors?.body, form: r.fieldErrors ? undefined : r.error });
        return;
      }
      toast.success("Terima kasih! Testimonimu menunggu tinjauan admin sebelum tampil di beranda.");
      setOpen(false);
      router.refresh();
    });
  };

  const openingId = `testi-pembuka-${courseId}`;
  const bodyId = `testi-isi-${courseId}`;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : autoOpen ? later() : setOpen(false))}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90dvh] gap-5 overflow-y-auto p-6 sm:max-w-lg">
        <DialogHeader className="gap-3 text-left">
          <SproutMark className="size-9" />
          <DialogTitle className="text-xl font-bold">Kelas {courseTitle} selesai</DialogTitle>
          <DialogDescription className="text-base">
            Ceritakan pengalamanmu belajar di kelas ini. Testimoni ditinjau admin dulu sebelum tampil di beranda, dengan namamu dan
            nama kelasnya.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {errors.form && (
            <p role="alert" className="text-sm font-semibold text-destructive">
              {errors.form}
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={openingId} className="font-semibold">
              Kalimat pembuka
            </label>
            <Input
              id={openingId}
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              maxLength={160}
              placeholder="Mis. Bab logika akhirnya terasa masuk akal"
              aria-invalid={Boolean(errors.opening)}
              aria-describedby={errors.opening ? `${openingId}-error` : undefined}
            />
            {errors.opening && (
              <p id={`${openingId}-error`} className="text-sm text-destructive">
                {errors.opening}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={bodyId} className="font-semibold">
              Ceritamu
            </label>
            <Textarea
              id={bodyId}
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={1200}
              aria-invalid={Boolean(errors.body)}
              aria-describedby={errors.body ? `${bodyId}-error` : undefined}
            />
            {errors.body && (
              <p id={`${bodyId}-error`} className="text-sm text-destructive">
                {errors.body}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Mengirim…" : "Kirim testimoni"}
            </Button>
            <Button type="button" variant="ghost" onClick={later}>
              Nanti saja
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
