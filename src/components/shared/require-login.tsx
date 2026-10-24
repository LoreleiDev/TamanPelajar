"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { SproutMark } from "@/components/shared/ornaments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Satu komponen bersama untuk interaksi tamu (C.5.2–C.5.4): membuka materi, memutar video,
// mulai tryout, keranjang, bookmark, diskusi. Server tetap menolak akses (C.5.5);
// dialog ini hanya mengarahkan tamu ke halaman masuk lalu kembali via callbackUrl.

type RequireLogin = (reason: string, onAuthenticated?: () => void) => void;

const LoginContext = createContext<{ isAuthenticated: boolean; requireLogin: RequireLogin } | null>(null);

export function LoginRequiredProvider({
  isAuthenticated,
  children,
}: {
  isAuthenticated: boolean;
  children: ReactNode;
}) {
  const [reason, setReason] = useState<string | null>(null);
  const [callbackUrl, setCallbackUrl] = useState("/");

  const requireLogin = useCallback<RequireLogin>(
    (why, onAuthenticated) => {
      if (isAuthenticated) {
        onAuthenticated?.();
        return;
      }
      // Dibaca saat diklik agar tidak perlu useSearchParams (yang menuntut Suspense).
      setCallbackUrl(window.location.pathname + window.location.search);
      setReason(why);
    },
    [isAuthenticated],
  );

  const value = useMemo(() => ({ isAuthenticated, requireLogin }), [isAuthenticated, requireLogin]);
  const query = `?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <LoginContext.Provider value={value}>
      {children}
      <Dialog open={reason !== null} onOpenChange={(open) => !open && setReason(null)}>
        <DialogContent className="gap-5 p-6 sm:max-w-md">
          <DialogHeader className="gap-3 text-left">
            <SproutMark className="size-9" />
            <DialogTitle className="text-xl font-bold">Masuk dulu untuk melanjutkan</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              {reason} Setelah masuk, Anda kembali ke halaman ini.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-start">
            <Button asChild size="lg">
              <Link href={`/masuk${query}`}>Masuk</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={`/daftar${query}`}>Daftar akun baru</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LoginContext.Provider>
  );
}

export function useRequireLogin() {
  const ctx = useContext(LoginContext);
  if (!ctx) throw new Error("useRequireLogin harus dipakai di dalam LoginRequiredProvider");
  return ctx;
}
