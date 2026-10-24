"use client";

import { Menu, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { AccountMenu, MobileAccount, NotificationBell, type AccountSummary } from "@/components/layout/account-menu";
import { Logo } from "@/components/layout/logo";
import { isActivePath, mainNav } from "@/components/layout/nav-items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/** Form pencarian GET ke katalog, jadi tetap berfungsi tanpa JavaScript (B.2.3). */
function SearchForm({ id, className }: { id: string; className?: string }) {
  return (
    <form action="/program" role="search" className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        Cari program, kelas, atau tryout
      </label>
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input id={id} name="q" type="search" placeholder="Cari tryout SKD, UTBK…" className="pl-9" />
    </form>
  );
}

/**
 * Navbar sticky (B.2): logo, enam menu, pencarian, notifikasi, foto dan nama pengguna,
 * atau Masuk/Daftar untuk tamu. `account` diisi HeaderWithAccount dari sesi.
 */
export function SiteHeader({ account }: { account: AccountSummary | null | "loading" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background" /* taste-skill-ignore: border tipis brand */>
      <div className="page-container flex h-16 items-center gap-4">
        <Link href="/" className="shrink-0 rounded-md" aria-label="Taman Pelajar, ke beranda">
          <Logo />
        </Link>

        <nav aria-label="Menu utama" className="ml-2 hidden lg:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-md px-2.5 py-2 text-[0.9375rem] font-semibold transition-colors duration-150 hover:text-primary",
                      active ? "text-primary" : "text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SearchForm id="cari-desktop" className="hidden w-60 xl:block" />
          <Button asChild variant="ghost" size="icon" className="xl:hidden">
            <Link href="/program" aria-label="Cari program">
              <Search />
            </Link>
          </Button>
          {account === "loading" ? (
<<<<<<< HEAD
            <Skeleton aria-hidden="true" className="hidden size-10 rounded-full sm:block" />
=======
            <span aria-hidden="true" className="hidden size-10 animate-pulse rounded-full bg-muted sm:block" />
>>>>>>> aff4f2773b8df2b079ffefbc949056eb2b7437cd
          ) : account ? (
            <div className="hidden items-center gap-1 sm:flex">
              <NotificationBell unread={account.unread} />
              <AccountMenu account={account} />
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="ghost">
                <Link href="/masuk">Masuk</Link>
              </Button>
              <Button asChild>
                <Link href="/daftar">Daftar</Link>
              </Button>
            </div>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Buka menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(22rem,88vw)] gap-0 p-0">
              <SheetHeader className="border-b border-border p-4" /* taste-skill-ignore: overlay */>
                <SheetTitle>
                  <Logo />
                </SheetTitle>
                <SheetDescription className="sr-only">Menu navigasi Taman Pelajar</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-6 overflow-y-auto p-4">
                <SearchForm id="cari-mobile" />
                <nav aria-label="Menu utama">
                  <ul className="flex flex-col">
                    {mainNav.map((item) => {
                      const active = isActivePath(pathname, item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "block rounded-lg px-3 py-3 text-base font-semibold",
                              active ? "bg-accent text-primary" : "text-foreground hover:bg-secondary",
                            )}
                          >
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
                {account !== "loading" && <MobileAccount account={account} onNavigate={() => setOpen(false)} />}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
