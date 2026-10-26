"use client";

import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/features/auth/components/native-select";
import type { ActionResult } from "@/lib/action-result";
import { difficultyLabel, questionTypeLabel, type QuestionTypeCode } from "@/features/admin/questions/schemas";

export interface Found {
  id: string;
  excerpt: string;
  subject: string;
  topic: string;
  type: QuestionTypeCode;
  difficulty: "MUDAH" | "SEDANG" | "SULIT";
  status: "DRAF" | "TERBIT" | "ARSIP";
}

export interface PickerFilter {
  q: string;
  categoryId: string;
  subject: string;
  difficulty: string;
}

/** Pilih soal dari bank soal untuk subtes tryout (M.6.8) atau kuis materi (L.2.5). */
export function QuestionPicker({
  id: sectionId,
  targetTitle: sectionTitle,
  categories,
  defaultCategoryId,
  subjects,
  note,
  search: searchAction,
  add: addAction,
}: {
  id: string;
  targetTitle: string;
  categories: { id: string; name: string }[];
  defaultCategoryId: string;
  subjects: string[];
  note: string;
  search: (filter: PickerFilter) => Promise<ActionResult<Found[]>>;
  add: (questionIds: string[]) => Promise<ActionResult<{ added: number }>>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState({ q: "", categoryId: defaultCategoryId, subject: "", difficulty: "" });
  const [rows, setRows] = useState<Found[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  const search = (next = filter) =>
    start(async () => {
      setError(undefined);
      const r = await searchAction(next);
      if (!r.ok) return setError(r.error);
      setRows(r.data);
    });

  const add = () =>
    start(async () => {
      const r = await addAction([...picked]);
      if (!r.ok) return setError(r.error);
      toast.success(`${r.data.added} soal ditambahkan ke ${sectionTitle}.`);
      setPicked(new Set());
      setOpen(false);
      router.refresh();
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v && rows === null) search();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus data-icon="inline-start" />
          Tambah soal
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-4 p-6 sm:max-w-3xl">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-bold">Tambah soal ke {sectionTitle}</DialogTitle>
          <DialogDescription>{note}</DialogDescription>
        </DialogHeader>
        <form
          className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_10rem_8rem_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            search();
          }}
        >
          <div className="flex flex-col gap-1">
            <label htmlFor={`cari-${sectionId}`} className="text-sm font-semibold">
              Cari
            </label>
            <Input id={`cari-${sectionId}`} value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} placeholder="Isi soal atau topik" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`kat-${sectionId}`} className="text-sm font-semibold">
              Kategori
            </label>
            <NativeSelect id={`kat-${sectionId}`} value={filter.categoryId} onChange={(e) => setFilter({ ...filter, categoryId: e.target.value })}>
              <option value="">Semua</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`mapel-${sectionId}`} className="text-sm font-semibold">
              Mata pelajaran
            </label>
            <NativeSelect id={`mapel-${sectionId}`} value={filter.subject} onChange={(e) => setFilter({ ...filter, subject: e.target.value })}>
              <option value="">Semua</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`sulit-${sectionId}`} className="text-sm font-semibold">
              Kesulitan
            </label>
            <NativeSelect id={`sulit-${sectionId}`} value={filter.difficulty} onChange={(e) => setFilter({ ...filter, difficulty: e.target.value })}>
              <option value="">Semua</option>
              {Object.entries(difficultyLabel).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </NativeSelect>
          </div>
          <Button type="submit" variant="outline" disabled={pending}>
            <Search data-icon="inline-start" />
            Cari
          </Button>
        </form>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="min-h-40 flex-1 overflow-y-auto rounded-xl border border-border" aria-busy={pending}>
          {rows === null ? (
            <p className="p-4 text-sm text-muted-foreground">Memuat soal…</p>
          ) : rows.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Tidak ada soal yang cocok. Ubah filter atau tambahkan soal di Bank soal.</p>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((q) => (
                <li key={q.id}>
                  <label className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-secondary">
                    <input
                      type="checkbox"
                      className="mt-1 size-4.5 shrink-0 accent-primary"
                      checked={picked.has(q.id)}
                      onChange={(e) => {
                        const next = new Set(picked);
                        if (e.target.checked) next.add(q.id);
                        else next.delete(q.id);
                        setPicked(next);
                      }}
                    />
                    <span className="min-w-0">
                      <span className="line-clamp-2">{q.excerpt}</span>
                      <span className="block text-sm text-muted-foreground">
                        {q.subject} · {q.topic} · {questionTypeLabel[q.type]} · {difficultyLabel[q.difficulty]}
                        {q.status === "DRAF" && " · draf"}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground tabular-nums">{picked.size} soal dipilih</span>
          <Button disabled={pending || picked.size === 0} onClick={add}>
            Tambahkan {picked.size > 0 ? `${picked.size} soal` : "soal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
