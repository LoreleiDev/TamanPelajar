"use client";

import Link from "next/link";
import { getSession, SessionProvider, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

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

const LoginContext = createContext<{ isAuthenticated: boolean; isAdmin: boolean; requireLogin: RequireLogin } | null>(null);

export function LoginRequiredProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <LoginRequiredInner>{children}</LoginRequiredInner>
    </SessionProvider>
  );
}

function LoginRequiredInner({ children }: { children: ReactNode }) {
  // Status sesi dibaca di client (/api/auth/session) agar halaman publik tetap statis.
  const { data, status, update } = useSession();
  const isAuthenticated = status === "authenticated";
  const isAdmin = data?.user?.role === "ADMIN";
  const router = useRouter();
  const [reason, setReason] = useState<string | null>(null);
  const [callbackUrl, setCallbackUrl] = useState("/");

  const requireLogin = useCallback<RequireLogin>(
    (why, onAuthenticated) => {
      if (isAuthenticated) {
        onAuthenticated?.();
        return;
      }
      // Dibaca saat diklik agar tidak perlu useSearchParams (yang menuntut Suspense).
      const here = window.location.pathname + window.location.search;
      // Sesi di client bisa tertinggal (mis. baru masuk di tab lain): cek ulang sebelum
      // menampilkan dialog masuk.
      void getSession().then((fresh) => {
        if (fresh?.user) {
          void update();
          // Tanpa aksi lanjutan, halaman dirender ulang agar tampil sebagai pengguna yang masuk.
          if (onAuthenticated) onAuthenticated();
          else router.refresh();
          return;
        }
        setCallbackUrl(here);
        setReason(why);
      });
    },
    [isAuthenticated, update, router],
  );

  const value = useMemo(() => ({ isAuthenticated, isAdmin, requireLogin }), [isAuthenticated, isAdmin, requireLogin]);
  const query = `?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <LoginContext.Provider value={value}>
      {/* usePathname butuh Suspense di rute dinamis (cacheComponents). */}
      <Suspense fallback={null}>
        <SessionSync />
      </Suspense>
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
          {/* Provider ada di root layout: tutup dialog saat pindah ke halaman masuk/daftar. */}
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-start">
            <Button asChild size="lg">
              <Link href={`/masuk${query}`} onClick={() => setReason(null)}>Masuk</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={`/daftar${query}`} onClick={() => setReason(null)}>Daftar akun baru</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LoginContext.Provider>
  );
}

/**
 * Masuk dan keluar berjalan lewat server action lalu navigasi client, sehingga
 * SessionProvider tidak tahu sesinya berubah. Muat ulang sesi setiap pindah halaman.
 */
function SessionSync() {
  const pathname = usePathname();
  const { update } = useSession();
  useEffect(() => {
    void update();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- update berganti tiap kali sesi dimuat
  }, [pathname]);
  return null;
}

export function useRequireLogin() {
  const ctx = useContext(LoginContext);
  if (!ctx) throw new Error("useRequireLogin harus dipakai di dalam LoginRequiredProvider");
  return ctx;
}
