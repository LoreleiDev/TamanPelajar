"use client";

import { Eye, EyeOff, MailCheck } from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { passwordStrength } from "@/features/auth/schemas";
import { cn } from "@/lib/utils";

/** Label + kontrol + pesan error yang terhubung lewat aria-describedby (Q.1.3). */
export function Field({
  label,
  error,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  error?: string;
  hint?: ReactNode;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="font-semibold">
        {label}
      </Label>
      {children}
      {hint && !error && <div className="text-sm text-muted-foreground">{hint}</div>}
      {error && (
        <p id={`${htmlFor}-error`} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const describedBy = (id: string, error?: string) => (error ? `${id}-error` : undefined);

/** Input password dengan tombol tampilkan/sembunyikan (E.3.4). */
export function PasswordInput({ className, ...props }: ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className={cn("pr-11", className)} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
        aria-pressed={visible}
        className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </div>
  );
}

const barColors = ["bg-muted", "bg-destructive", "bg-warning", "bg-leaf", "bg-success"];

/** Indikator kekuatan password (E.3.3): batang + teks, bukan warna saja. */
export function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, label } = passwordStrength(password);
  return (
    <div className="flex items-center gap-3" aria-live="polite">
      <div className="flex flex-1 gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-150", i <= score ? barColors[score] : "bg-muted")} />
        ))}
      </div>
      <span className="w-24 text-right text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

/**
 * Pemberitahuan setelah email dikirim. Saat MAIL_MODE="log" (lokal/demo) tautan juga
 * ditampilkan agar alur bisa dilanjutkan tanpa kotak masuk sungguhan.
 */
export function MailSentNotice({
  title,
  description,
  demoLink,
  demoLabel,
  children,
}: {
  title: string;
  description: ReactNode;
  demoLink?: string;
  demoLabel: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4" role="status">
      <MailCheck className="size-10 text-primary" aria-hidden="true" />
      <h1 className="text-heading">{title}</h1>
      <div className="text-muted-foreground">{description}</div>
      {demoLink && (
        <div className="rounded-xl bg-accent p-4 text-sm">
          <p className="font-semibold text-foreground">Mode demo</p>
          <p className="mt-1 text-muted-foreground">
            Email tidak benar-benar dikirim. Buka tautannya langsung dari sini:
          </p>
          <a href={demoLink} className="mt-2 inline-block font-semibold text-primary underline underline-offset-4">
            {demoLabel}
          </a>
        </div>
      )}
      {children}
    </div>
  );
}

/** Pesan error di atas form, untuk kesalahan yang bukan milik satu field. */
export function FormAlert({ message, children }: { message?: string; children?: ReactNode }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/6 px-4 py-3 text-sm text-destructive">
      {message}
      {children}
    </div>
  );
}
