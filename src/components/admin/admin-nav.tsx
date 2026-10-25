"use client";

import {
  Banknote,
  ClipboardCheck,
  ClipboardList,
  FileQuestion,
  LayoutDashboard,
  Menu,
  ScrollText,
  TicketPercent,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// Menu panel administrator (M.1), dikelompokkan agar 16+ menu tetap mudah dipindai.
// Menu ditambahkan ke sini bersamaan dengan halamannya, jadi tidak ada tautan mati.
export type AdminBadges = Partial<Record<"penilaian" | "diskusi" | "transaksi", number>>;

interface Item {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: keyof AdminBadges;
}

const groups: { title: string; items: Item[] }[] = [
  {
    title: "Ringkasan",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Pengguna dan penjualan",
    items: [
      { href: "/admin/pengguna", label: "Pengguna", icon: UsersRound },
      { href: "/admin/transaksi", label: "Transaksi", icon: Banknote, badge: "transaksi" },
      { href: "/admin/voucher", label: "Voucher", icon: TicketPercent },
    ],
  },
  {
    title: "Konten belajar",
    items: [
      { href: "/admin/tryout", label: "Tryout", icon: ClipboardList },
      { href: "/admin/bank-soal", label: "Bank Soal", icon: FileQuestion },
      { href: "/admin/penilaian", label: "Penilaian", icon: ClipboardCheck, badge: "penilaian" },
    ],
  },
  {
    title: "Sistem",
    items: [{ href: "/admin/audit-log", label: "Audit log", icon: ScrollText }],
  },
];

const allItems = groups.flatMap((g) => g.items);

const isActive = (href: string, pathname: string) => (href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

function NavList({ badges, onNavigate }: { badges: AdminBadges; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => (
        <div key={g.title} className="flex flex-col gap-1">
          <p className="px-3 text-sm font-semibold text-muted-foreground">{g.title}</p>
          <ul className="flex flex-col gap-0.5">
            {g.items.map(({ href, label, icon: Icon, badge }) => {
              const active = isActive(href, pathname);
              const count = badge ? (badges[badge] ?? 0) : 0;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[0.9375rem] font-semibold transition-colors duration-150",
                      active ? "bg-accent text-primary" : "text-foreground hover:bg-secondary",
                    )}
                  >
                    <Icon aria-hidden="true" className="size-4.5 shrink-0" />
                    {label}
                    {count > 0 && (
                      <span className="ml-auto rounded-full bg-bark px-1.5 text-xs leading-5 text-white tabular-nums">
                        {count}
                        <span className="sr-only"> perlu ditindaklanjuti</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Sidebar di desktop; di layar kecil menjadi tombol yang membuka lembar menu. */
export function AdminNav({ badges }: { badges: AdminBadges }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = allItems.find((i) => isActive(i.href, pathname));

  return (
    <>
      <nav aria-label="Menu admin" className="hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto lg:pb-4">
        <NavList badges={badges} />
      </nav>
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <Menu data-icon="inline-start" />
              Menu admin
              {current && <span className="ml-auto text-muted-foreground">{current.label}</span>}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="overflow-y-auto p-4">
            <SheetHeader className="p-0">
              <SheetTitle>Menu admin</SheetTitle>
              <SheetDescription className="sr-only">Pilih halaman panel administrator</SheetDescription>
            </SheetHeader>
            <nav aria-label="Menu admin">
              <NavList badges={badges} onNavigate={() => setOpen(false)} />
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
