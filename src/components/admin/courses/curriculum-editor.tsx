"use client";

import { FileText, ListChecks, NotebookPen, Pencil, PlayCircle, Plus, Trash2, Type, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { SortableList } from "@/components/admin/sortable-list";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/features/auth/components/native-select";
import { hapusBab, hapusMateri, tambahBab, tambahMateri, ubahBab, urutkanBab, urutkanMateri } from "@/features/admin/courses/actions";
import { LESSON_TYPES, lessonTypeLabel, type LessonTypeCode } from "@/features/admin/courses/schemas";
import type { ActionResult } from "@/lib/action-result";
import { formatClock } from "@/lib/format";

export interface CurriculumLesson {
  id: string;
  title: string;
  type: LessonTypeCode;
  durationSec: number | null;
  detail: string;
  progress: number;
}

export interface CurriculumSection {
  id: string;
  title: string;
  isFree: boolean;
  lessons: CurriculumLesson[];
}

const typeIcon: Record<LessonTypeCode, LucideIcon> = { VIDEO: PlayCircle, PDF: FileText, TEKS: Type, KUIS: ListChecks, TUGAS: NotebookPen };

function useRun() {
  const router = useRouter();
  return async (p: Promise<ActionResult<unknown>>, success?: string) => {
    const r = await p;
    if (!r.ok) {
      toast.error(r.error);
      return false;
    }
    if (success) toast.success(success);
    router.refresh();
    return true;
  };
}

function SectionTitleDialog({ section }: { section: CurriculumSection }) {
  const run = useRun();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(section.title);
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" aria-label={`Ubah judul bab ${section.title}`}>
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-4 p-6 sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-bold">Ubah judul bab</DialogTitle>
          <DialogDescription className="sr-only">Judul bab tampil di sidebar kurikulum siswa.</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              if (await run(ubahBab({ id: section.id, title, isFree: section.isFree }), "Judul bab disimpan.")) setOpen(false);
            });
          }}
        >
          <label htmlFor={`judul-${section.id}`} className="font-semibold">
            Judul bab
          </label>
          <Input id={`judul-${section.id}`} value={title} onChange={(e) => setTitle(e.target.value)} />
          <Button type="submit" disabled={pending} className="self-start">
            Simpan
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Tanda bab gratis (L.2.10), langsung berubah lalu disimpan; kembali bila gagal. */
function FreeToggle({ section }: { section: CurriculumSection }) {
  const run = useRun();
  const [checked, setChecked] = useState(section.isFree);
  const [prev, setPrev] = useState(section.isFree);
  if (section.isFree !== prev) {
    setPrev(section.isFree);
    setChecked(section.isFree);
  }
  return (
    <label className="flex items-center gap-2 text-sm font-semibold">
      <input
        type="checkbox"
        className="size-4.5 accent-primary"
        checked={checked}
        onChange={async (e) => {
          const next = e.target.checked;
          setChecked(next);
          const saved = await run(ubahBab({ id: section.id, title: section.title, isFree: next }), next ? "Bab ditandai gratis." : "Bab kini untuk pelanggan.");
          if (!saved) setChecked(!next);
        }}
      />
      Gratis
    </label>
  );
}

function AddLessonForm({ sectionId, courseId }: { sectionId: string; courseId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<LessonTypeCode>("VIDEO");
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await tambahMateri({ sectionId, title, type });
          if (!r.ok) return void toast.error(r.fieldErrors?.title ?? r.error);
          toast.success("Materi ditambahkan. Lengkapi isinya.");
          router.push(`/admin/kelas/${courseId}/materi/${r.data.id}`);
        });
      }}
    >
      <div className="flex min-w-48 flex-1 flex-col gap-1">
        <label htmlFor={`materi-baru-${sectionId}`} className="text-sm font-semibold">
          Materi baru
        </label>
        <Input id={`materi-baru-${sectionId}`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul materi" />
      </div>
      <div className="flex w-32 flex-col gap-1">
        <label htmlFor={`jenis-baru-${sectionId}`} className="text-sm font-semibold">
          Jenis
        </label>
        <NativeSelect id={`jenis-baru-${sectionId}`} value={type} onChange={(e) => setType(e.target.value as LessonTypeCode)}>
          {LESSON_TYPES.map((t) => (
            <option key={t} value={t}>
              {lessonTypeLabel[t]}
            </option>
          ))}
        </NativeSelect>
      </div>
      <Button type="submit" variant="outline" disabled={pending || title.trim().length < 2}>
        <Plus data-icon="inline-start" />
        Tambah
      </Button>
    </form>
  );
}

/** Kurikulum kelas (L.2.2, L.2.10): bab dan materi diurutkan dengan seret-dan-lepas, bab gratis ditandai. */
export function CurriculumEditor({ courseId, sections }: { courseId: string; sections: CurriculumSection[] }) {
  const run = useRun();
  const [newSection, setNewSection] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        Seret pegangan di kiri untuk mengurutkan (atau fokus pegangan lalu Spasi dan panah). Bab gratis terbuka untuk semua pengguna yang sudah masuk; bab lain
        butuh paket aktif.
      </p>
      {sections.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-muted-foreground">Belum ada bab. Tambahkan bab pertama di bawah.</p>
      ) : (
        <SortableList
          items={sections}
          label="Bab kelas"
          itemLabel={(s) => `bab ${s.title}`}
          className="gap-4"
          onReorder={(ids) => run(urutkanBab({ parentId: courseId, ids }))}
          renderItem={(s, handle) => {
            const index = sections.findIndex((x) => x.id === s.id);
            return (
              <section aria-label={`Bab ${index + 1}: ${s.title}`} className="flex flex-col gap-3 rounded-xl border border-border p-4">
                <header className="flex flex-wrap items-center gap-2">
                  {handle}
                  <h3 className="min-w-0 flex-1 text-lg font-bold">
                    Bab {index + 1}. {s.title}
                  </h3>
                  <FreeToggle section={s} />
                  <SectionTitleDialog section={s} />
                  {s.lessons.length === 0 && (
                    <ConfirmDialog
                      trigger={
                        <Button size="icon" variant="ghost" aria-label={`Hapus bab ${s.title}`} className="text-destructive hover:text-destructive">
                          <Trash2 />
                        </Button>
                      }
                      title={`Hapus bab ${s.title}?`}
                      description="Bab kosong ini dihapus dan urutan bab lain dirapatkan."
                      confirmLabel="Hapus bab"
                      destructive
                      onConfirm={async () => void (await run(hapusBab({ id: s.id }), "Bab dihapus."))}
                    />
                  )}
                </header>
                {s.lessons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada materi di bab ini.</p>
                ) : (
                  <SortableList
                    items={s.lessons}
                    label={`Materi bab ${s.title}`}
                    itemLabel={(l) => `materi ${l.title}`}
                    className="divide-y divide-border overflow-hidden rounded-lg border border-border"
                    onReorder={(ids) => run(urutkanMateri({ parentId: s.id, ids }))}
                    renderItem={(l, lessonHandle) => {
                      const Icon = typeIcon[l.type];
                      return (
                        <div className="flex items-center gap-2 px-2 py-2 sm:gap-3">
                          {lessonHandle}
                          <Icon aria-hidden="true" className="size-4.5 shrink-0 text-primary" />
                          <div className="min-w-0 flex-1">
                            <Link href={`/admin/kelas/${courseId}/materi/${l.id}`} className="font-semibold hover:text-primary">
                              {l.title}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {lessonTypeLabel[l.type]}
                              {l.durationSec ? ` · ${formatClock(l.durationSec)}` : ""}
                              {l.detail && ` · ${l.detail}`}
                              {l.progress > 0 && ` · dibuka ${l.progress} siswa`}
                            </p>
                          </div>
                          <ConfirmDialog
                            trigger={
                              <Button size="icon" variant="ghost" aria-label={`Hapus materi ${l.title}`} className="shrink-0 text-muted-foreground hover:text-destructive">
                                <Trash2 />
                              </Button>
                            }
                            title={`Hapus materi ${l.title}?`}
                            description={
                              l.progress > 0
                                ? `Progres ${l.progress} siswa, catatan, dan diskusi di materi ini ikut terhapus.`
                                : "Materi, lampiran, dan kuisnya dihapus permanen."
                            }
                            confirmLabel="Hapus materi"
                            destructive
                            onConfirm={async () => void (await run(hapusMateri({ id: l.id }), "Materi dihapus."))}
                          />
                        </div>
                      );
                    }}
                  />
                )}
                <AddLessonForm sectionId={s.id} courseId={courseId} />
              </section>
            );
          }}
        />
      )}
      <form
        className="flex flex-wrap items-end gap-2 rounded-xl bg-secondary p-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            if (await run(tambahBab({ courseId, title: newSection }), "Bab ditambahkan.")) setNewSection("");
          });
        }}
      >
        <div className="flex min-w-56 flex-1 flex-col gap-1">
          <label htmlFor="bab-baru" className="text-sm font-semibold">
            Bab baru
          </label>
          <Input id="bab-baru" value={newSection} onChange={(e) => setNewSection(e.target.value)} placeholder="Judul bab" />
        </div>
        <Button type="submit" disabled={pending || newSection.trim().length < 2}>
          <Plus data-icon="inline-start" />
          Tambah bab
        </Button>
      </form>
    </div>
  );
}
