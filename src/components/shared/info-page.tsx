import type { ReactNode } from "react";

import { SproutDivider } from "@/components/shared/ornaments";

export interface InfoSection {
  id: string;
  title: string;
  body: ReactNode;
}

/**
 * Halaman teks (tentang, bantuan, kebijakan, syarat, kontak). Daftar isi di kiri
 * pada desktop, isi dengan lebar baca nyaman di kanan.
 */
export function InfoPage({
  title,
  intro,
  updatedAt,
  sections,
}: {
  title: string;
  intro: string;
  updatedAt?: string;
  sections: InfoSection[];
}) {
  return (
    <main className="page-container flex flex-col gap-10 py-12 md:py-16">
      <header className="flex max-w-3xl flex-col gap-4">
        <h1 className="text-title text-primary">{title}</h1>
        <p className="text-lead">{intro}</p>
        {updatedAt && <p className="text-sm text-muted-foreground">Terakhir diperbarui {updatedAt}</p>}
      </header>
      <SproutDivider />
      <div className="grid gap-10 lg:grid-cols-[16rem_1fr]">
        <nav aria-label="Daftar isi" className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="mb-3 text-sm font-bold">Daftar isi</h2>
          <ol className="flex flex-col gap-2 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-muted-foreground hover:text-primary">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="flex max-w-[68ch] flex-col gap-10">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="flex scroll-mt-24 flex-col gap-3">
              <h2 className="text-heading">{s.title}</h2>
              <div className="flex flex-col gap-3 leading-relaxed [&_li]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1.5">
                {s.body}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
