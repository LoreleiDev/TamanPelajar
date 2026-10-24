import type { Thing, WithContext } from "schema-dts";

/** Schema markup JSON-LD (Q.2.6). `<` di-escape agar isi tidak bisa menutup tag script. */
export function JsonLd<T extends Thing>({ data }: { data: WithContext<T> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
