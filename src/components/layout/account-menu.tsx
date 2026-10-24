"use client";

import { Bell, LayoutDashboard, LogOut, Receipt, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { keluar } from "@/features/auth/actions";

export interface AccountSummary {
  name: string;
  email: string;
  image: string | null;
  role: "ADMIN" | "USER";
  unread: number;
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/** Lonceng notifikasi (B.2.4) dengan jumlah belum dibaca sebagai teks, bukan warna saja. */
export function NotificationBell({ unread }: { unread: number }) {
  const label = unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi";
  return (
    <Button asChild variant="ghost" size="icon" className="relative">
      <Link href="/dashboard/notifikasi" aria-label={label}>
        <Bell />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1 right-1 grid min-w-4.5 place-items-center rounded-full bg-bark px-1 text-[0.6875rem] leading-4.5 font-bold text-white tabular-nums"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
    </Button>
  );
}

/** Foto dan nama pengguna (B.2.5) dengan menu akun. */
export function AccountMenu({ account }: { account: AccountSummary }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full py-1 pr-1 pl-1 hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none xl:pr-3"
          aria-label={`Menu akun ${account.name}`}
        >
          <Avatar className="size-8">
            {account.image && <AvatarImage src={account.image} alt="" />}
            <AvatarFallback className="bg-primary text-sm font-bold text-white">{initials(account.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate text-sm font-semibold xl:inline">{account.name.split(" ")[0]}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate font-bold text-foreground">{account.name}</span>
          <span className="truncate text-sm font-normal text-muted-foreground">{account.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {account.role === "ADMIN" && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <ShieldCheck /> Panel admin
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard /> Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profil">
            <UserRound /> Profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/transaksi">
            <Receipt /> Transaksi
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={keluar}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut /> Keluar
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Ringkasan akun di menu hamburger mobile. */
export function MobileAccount({ account, onNavigate }: { account: AccountSummary | null; onNavigate: () => void }) {
  if (!account) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Button asChild variant="outline" size="lg">
          <Link href="/masuk" onClick={onNavigate}>
            Masuk
          </Link>
        </Button>
        <Button asChild size="lg">
          <Link href="/daftar" onClick={onNavigate}>
            Daftar
          </Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-secondary p-3">
      <div className="flex items-center gap-3">
        <Avatar className="size-10">
          {account.image && <AvatarImage src={account.image} alt="" />}
          <AvatarFallback className="bg-primary font-bold text-white">{initials(account.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-bold">{account.name}</p>
          <p className="truncate text-sm text-muted-foreground">{account.email}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button asChild size="sm" variant="outline" className="bg-background">
          <Link href={account.role === "ADMIN" ? "/admin" : "/dashboard"} onClick={onNavigate}>
            {account.role === "ADMIN" ? "Panel admin" : "Dashboard"}
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="bg-background">
          <Link href="/dashboard/notifikasi" onClick={onNavigate}>
            Notifikasi{account.unread > 0 ? ` (${account.unread})` : ""}
          </Link>
        </Button>
      </div>
      <form action={keluar}>
        <Button type="submit" variant="ghost" size="sm" className="w-full">
          <LogOut data-icon="inline-start" /> Keluar
        </Button>
      </form>
    </div>
  );
}
