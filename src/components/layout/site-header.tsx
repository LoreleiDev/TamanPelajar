"use client";

import { Menu, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";

import { CloseMobileMenuContext } from "@/components/layout/account-menu";
import { Logo } from "@/components/layout/logo";
import { isActivePath, mainNav } from "@/components/layout/nav-items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/** Form pencarian GET ke katalog, jadi tetap berfungsi tanpa JavaScript (B.2.3). */
function SearchForm({ id, className }: { id: string; className?: string }) {
  return (
    <form action="/program" role="search" aria-label="Pencarian situs" className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        Cari program, kelas, atau tryout
      </label>
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input id={id} name="q" type="search" placeholder="Cari tryout SKD, UTBK…" className="pl-9" />
    </form>
  );
}

function MainNavLinks({ pathname, onNavigate, mobile = false }: { pathname: string; onNavigate?: () => void; mobile?: boolean }) {
  return mainNav.map((item) => {
    const active = isActivePath(pathname, item.href);
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={
            mobile
              ? cn("block rounded-lg px-3 py-3 text-base font-semibold", active ? "bg-accent text-primary" : "text-foreground hover:bg-secondary")
              : cn(
                  "rounded-md px-2 py-2 text-sm font-semibold whitespace-nowrap transition-colors duration-150 hover:text-primary xl:px-2.5 xl:text-[0.9375rem]",
                  active ? "text-primary" : "text-foreground",
                )
          }
        >
          {item.label}
        </Link>
      </li>
    );
  });
}

/** Menu dengan penanda halaman aktif; usePathname() butuh Suspense di rute dinamis. */
function ActiveNavLinks(props: { onNavigate?: () => void; mobile?: boolean }) {
  return <MainNavLinks pathname={usePathname()} {...props} />;
}

function NavLinks(props: { onNavigate?: () => void; mobile?: boolean }) {
  return (
    <Suspense fallback={<MainNavLinks pathname="" {...props} />}>
      <ActiveNavLinks {...props} />
    </Suspense>
  );
}

/**
 * Navbar sticky (B.2): logo, enam menu, pencarian, keranjang, notifikasi, foto dan nama
 * pengguna, atau Masuk/Daftar untuk tamu. Kerangka navbar statis; hanya penanda menu aktif
 * dan slot akun (dari HeaderWithAccount) yang di-stream, sehingga teks di kolom pencarian
 * tidak hilang saat data akun tiba.
 */
export function SiteHeader({ account, mobileAccount }: { account: ReactNode; mobileAccount: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background" /* taste-skill-ignore: border tipis brand */>
      <div className="page-container flex h-16 items-center gap-4">
        <Link href="/" className="shrink-0 rounded-md" aria-label="Taman Pelajar Bimbingan belajar, ke beranda">
          <Logo />
        </Link>

        <nav aria-label="Menu utama" className="hidden lg:block xl:ml-2">
          <ul className="flex items-center gap-1">
            <NavLinks />
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SearchForm id="cari-desktop" className="hidden w-60 xl:block" />
          <Button asChild variant="ghost" size="icon" className="xl:hidden">
            <Link href="/program" aria-label="Cari program">
              <Search />
            </Link>
          </Button>
          {account}

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
                    <NavLinks mobile onNavigate={() => setOpen(false)} />
                  </ul>
                </nav>
                <CloseMobileMenuContext.Provider value={() => setOpen(false)}>{mobileAccount}</CloseMobileMenuContext.Provider>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
