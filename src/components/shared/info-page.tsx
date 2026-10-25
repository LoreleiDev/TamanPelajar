import type { ReactNode } from "react";

import { PageHeader } from "@/components/shared/page-header";

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
    <main className="flex flex-col">
      <PageHeader title={title} description={intro} meta={updatedAt && <span>Terakhir diperbarui {updatedAt}</span>} />
      <div className="page-container grid gap-10 py-10 md:py-12 lg:grid-cols-[16rem_1fr]">
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
