"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useContext, useMemo, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import { confirmAlert, preloadAlert } from "@/lib/alert";

// Hapus massal di tabel admin (revisi RMED): kotak centang per baris, "pilih semua", dan bilah
// aksi berisi tombol hapus. Tabelnya tetap dirender server; komponen ini hanya menyimpan pilihan.

export interface BulkDeleteReport {
  deleted: number;
  skipped: { name: string; reason: string }[];
}

type Ctx = { selected: Set<string>; toggle: (id: string, on: boolean) => void; setAll: (on: boolean) => void; ids: string[] };
const SelectionContext = createContext<Ctx | null>(null);

const useSelection = () => {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("Dipakai di dalam BulkSelection");
  return ctx;
};

export function BulkSelection({
  ids,
  noun,
  action,
  children,
}: {
  /** Semua id baris yang bisa dipilih, urut seperti tabel. */
  ids: string[];
  /** Kata benda untuk pesan, mis. "kelas", "video". */
  noun: string;
  action: (input: { ids: string[] }) => Promise<ActionResult<BulkDeleteReport>>;
  children: ReactNode;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const ctx = useMemo<Ctx>(
    () => ({
      selected,
      ids,
      toggle: (id, on) =>
        setSelected((prev) => {
          const next = new Set(prev);
          if (on) next.add(id);
          else next.delete(id);
          return next;
        }),
      setAll: (on) => setSelected(on ? new Set(ids) : new Set()),
    }),
    [selected, ids],
  );
  // Pilihan yang barisnya sudah hilang (dihapus atau tersaring) diabaikan.
  const chosen = ids.filter((id) => selected.has(id));

  const remove = async () => {
    const ok = await confirmAlert({
      title: `Hapus ${chosen.length} ${noun}?`,
      text: `${noun[0].toUpperCase()}${noun.slice(1)} yang masih dipakai tidak ikut dihapus dan akan disebutkan alasannya.`,
      confirmLabel: `Hapus ${chosen.length} ${noun}`,
      destructive: true,
    });
    if (!ok) return;
    start(async () => {
      const r = await action({ ids: chosen });
      if (!r.ok) return void toast.error(r.error);
      const { deleted, skipped } = r.data;
      if (deleted > 0) toast.success(`${deleted} ${noun} dihapus.`);
      if (skipped.length > 0) {
        toast.warning(`${skipped.length} ${noun} tidak dihapus`, {
          description: skipped.map((s) => `${s.name}: ${s.reason}`).join(" · "),
          duration: 10_000,
        });
      }
      setSelected(new Set());
      router.refresh();
    });
  };

  return (
    <SelectionContext.Provider value={ctx}>
      <div className="flex flex-col gap-3">
        {chosen.length > 0 && (
          <div role="region" aria-label="Aksi untuk baris terpilih" className="flex flex-wrap items-center gap-3 rounded-xl bg-secondary px-4 py-2.5">
            <span className="font-semibold tabular-nums">{chosen.length} dipilih</span>
            <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" disabled={pending} onPointerEnter={preloadAlert} onClick={() => void remove()}>
              <Trash2 data-icon="inline-start" aria-hidden="true" />
              {pending ? "Menghapus…" : `Hapus ${chosen.length} terpilih`}
            </Button>
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => setSelected(new Set())}>
              Batal pilih
            </Button>
          </div>
        )}
        {children}
      </div>
    </SelectionContext.Provider>
  );
}

/** Kotak centang "pilih semua" untuk kepala tabel. */
export function SelectAllCheckbox({ label }: { label: string }) {
  const { selected, ids, setAll } = useSelection();
  const count = ids.filter((id) => selected.has(id)).length;
  return (
    <input
      type="checkbox"
      aria-label={label}
      className="size-4.5 accent-primary"
      checked={ids.length > 0 && count === ids.length}
      ref={(el) => {
        if (el) el.indeterminate = count > 0 && count < ids.length;
      }}
      onChange={(e) => setAll(e.target.checked)}
    />
  );
}

/** Kotak centang satu baris. */
export function RowCheckbox({ id, label }: { id: string; label: string }) {
  const { selected, toggle } = useSelection();
  return (
    <input
      type="checkbox"
      aria-label={`Pilih ${label}`}
      className="size-4.5 accent-primary"
      checked={selected.has(id)}
      onChange={(e) => toggle(id, e.target.checked)}
    />
  );
}
