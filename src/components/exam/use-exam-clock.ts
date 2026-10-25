"use client";

import { useState, useSyncExternalStore } from "react";

// Jam ujian (I.4.1). Sisa waktu dihitung dari deadlineAt server dikurangi "sekarang" menurut
// server: selisih jam perangkat dan server diukur sekali saat halaman dimuat, sehingga jam
// perangkat yang salah tidak menambah atau mengurangi waktu.

function subscribe(onTick: () => void) {
  const id = window.setInterval(onTick, 250);
  return () => window.clearInterval(id);
}
const snapshot = () => Math.floor(Date.now() / 1000);
const serverSnapshot = () => null;

/** Detik epoch menurut server; null saat render server (timer baru tampil setelah hydration). */
export function useServerNow(serverNowIso: string): number | null {
  const [offsetMs] = useState(() => new Date(serverNowIso).getTime() - Date.now());
  const sec = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return sec === null ? null : sec + Math.round(offsetMs / 1000);
}

export function formatCountdown(totalSec: number) {
  const s = Math.max(0, totalSec);
  const h = Math.floor(s / 3600);
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${m}:${sec}` : `${m}:${sec}`;
}
