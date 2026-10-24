"use client";

import { BookOpen, ClipboardList, House, Receipt, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { isActivePath } from "@/components/layout/nav-items";
import { useRequireLogin } from "@/components/shared/require-login";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon; needsLogin?: string };

// B.3.2. Transaksi dan Profil butuh akun; tamu melihat dialog masuk (C.5.3).
const items: Item[] = [
  { href: "/", label: "Beranda", icon: House },
  { href: "/kelas", label: "Belajar", icon: BookOpen },
  { href: "/tryout", label: "Tryout", icon: ClipboardList },
  { href: "/transaksi", label: "Transaksi", icon: Receipt, needsLogin: "Riwayat transaksi tersimpan di akun Anda." },
  { href: "/dashboard/profil", label: "Profil", icon: UserRound, needsLogin: "Profil dan progres belajar tersimpan di akun Anda." },
];

const itemClass = "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[0.8125rem] font-semibold";

export function BottomNav() {
  const pathname = usePathname();
  const { isAuthenticated, requireLogin } = useRequireLogin();

  return (
    <nav
      aria-label="Navigasi bawah"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden" // taste-skill-ignore: border tipis brand (CLAUDE.md)
    >
      <ul className="flex px-2">
        {items.map(({ href, label, icon: Icon, needsLogin }) => {
          const active = isActivePath(pathname, href);
          const inner = (
            <>
              <Icon aria-hidden="true" className="size-5" strokeWidth={active ? 2.4 : 2} />
              {label}
            </>
          );
          return (
            <li key={href} className="flex flex-1">
              {needsLogin && !isAuthenticated ? (
                <button type="button" className={cn(itemClass, "text-muted-foreground")} onClick={() => requireLogin(needsLogin)}>
                  {inner}
                </button>
              ) : (
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(itemClass, active ? "text-primary" : "text-muted-foreground")}
                >
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
