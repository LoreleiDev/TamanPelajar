"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Testimonial } from "@/features/catalog/types";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/**
 * Testimoni (D.1.7) sebagai surat: satu per tampilan dengan tombol geser. Avatar berupa
 * inisial, tidak memakai foto.
 */
export function TestimonialLetters({ items }: { items: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const t = items[index];
  const go = (d: number) => setIndex((i) => (i + d + items.length) % items.length);

  return (
    <section aria-labelledby="testimoni-judul" aria-roledescription="carousel" className="bg-secondary py-20 md:py-32">
      <div className="page-container grid gap-10 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-3">
          <h2 id="testimoni-judul" className="text-heading">
            Cerita dari siswa
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="bg-background" onClick={() => go(-1)} aria-label="Cerita sebelumnya">
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon" className="bg-background" onClick={() => go(1)} aria-label="Cerita berikutnya">
              <ChevronRight />
            </Button>
            <p className="ml-2 text-sm text-muted-foreground tabular-nums" aria-live="polite">
              {index + 1} dari {items.length}
            </p>
          </div>
        </div>
        <article
          key={t.id}
          aria-roledescription="slide"
          aria-label={`Cerita ${index + 1} dari ${items.length}`}
          className="flex max-w-[38ch] flex-col gap-5 lg:col-span-7 lg:col-start-5 lg:max-w-[40ch]"
        >
          <p className="text-[clamp(1.5rem,1.2rem+1vw,2rem)] leading-snug font-semibold">{t.opening}</p>
          {t.body.map((para) => (
            <p key={para.slice(0, 24)} className="text-lg leading-relaxed">
              {para}
            </p>
          ))}
          <footer className="mt-6 flex items-center gap-3">
            <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-primary font-bold text-white">
              {initials(t.name)}
            </span>
            <span className="flex flex-col">
              <span className="font-bold">{t.name}</span>
              <span className="text-muted-foreground">{t.program}</span>
            </span>
          </footer>
        </article>
      </div>
    </section>
  );
}
