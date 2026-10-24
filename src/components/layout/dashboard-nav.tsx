"use client";

import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  PlayCircle,
  Receipt,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { keluar } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

// Menu sidebar dashboard siswa (F.1).
const items: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/dashboard/kelas", label: "Kelas Saya", icon: BookOpen },
  { href: "/dashboard/video", label: "Video Saya", icon: PlayCircle },
  { href: "/dashboard/tryout", label: "Tryout Saya", icon: ClipboardList },
  { href: "/dashboard/riwayat", label: "Riwayat Hasil", icon: History },
  { href: "/dashboard/analisis", label: "Analisis Kemampuan", icon: BarChart3 },
  { href: "/dashboard/transaksi", label: "Transaksi", icon: Receipt },
  { href: "/dashboard/sertifikat", label: "Sertifikat", icon: Award },
  { href: "/dashboard/notifikasi", label: "Notifikasi", icon: Bell },
  { href: "/dashboard/profil", label: "Profil", icon: UserRound },
];

export function DashboardNav({ unread }: { unread: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu dashboard" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
      {/* relative: teks sr-only (position absolute) tetap di dalam wadah geser, tidak melebarkan halaman. */}
      <ul className="relative -mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.9375rem] font-semibold whitespace-nowrap transition-colors duration-150",
                  active ? "bg-accent text-primary" : "text-foreground hover:bg-secondary",
                )}
              >
                <Icon aria-hidden="true" className="size-4.5" />
                {label}
                {href === "/dashboard/notifikasi" && unread > 0 && (
                  <span className="ml-auto rounded-full bg-bark px-1.5 text-xs leading-5 text-white tabular-nums">
                    {unread}
                    <span className="sr-only"> belum dibaca</span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0 lg:mt-2">
          <form action={keluar}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[0.9375rem] font-semibold whitespace-nowrap text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <LogOut aria-hidden="true" className="size-4.5" />
              Keluar
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
