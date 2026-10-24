import { ChevronDown } from "lucide-react";

import type { FaqItem } from "@/features/catalog/types";

/**
 * FAQ (D.1.8): judul lebar, pertanyaan menjorok. Memakai <details> sehingga accordion
 * tetap berfungsi tanpa JavaScript dan bisa dibuka dengan keyboard.
 */
export function HomeFaq({ items }: { items: FaqItem[] }) {
  return (
    <section aria-labelledby="faq-judul" className="page-container py-20 md:py-28">
      <h2 id="faq-judul" className="text-title max-w-[20ch]">
        Pertanyaan yang sering ditanyakan
      </h2>
      <div className="mt-12 flex flex-col gap-2 lg:ml-[33%] lg:mt-16">
        {items.map((f) => (
          <details key={f.question} className="group rounded-xl open:bg-accent">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-xl px-4 py-4 text-lg font-semibold hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/40 md:px-6 md:text-[1.375rem] [&::-webkit-details-marker]:hidden">
              {f.question}
              <ChevronDown
                aria-hidden="true"
                className="size-5 shrink-0 text-primary transition-transform duration-150 group-open:rotate-180"
              />
            </summary>
            <p className="max-w-[56ch] px-4 pb-5 text-base leading-relaxed md:px-6 md:text-[1.0625rem]">{f.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
