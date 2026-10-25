import { Search } from "lucide-react";
import Form from "next/form";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/features/auth/components/native-select";

export interface FilterSelect {
  name: string;
  label: string;
  value?: string;
  options: { value: string; label: string }[];
}

/**
 * Bilah pencarian dan filter halaman admin: form GET biasa, jadi tetap jalan tanpa
 * JavaScript dan setiap hasil filter punya URL sendiri.
 */
export function FilterBar({
  action,
  q,
  searchLabel,
  placeholder,
  selects = [],
}: {
  action: string;
  q?: string;
  searchLabel: string;
  placeholder: string;
  selects?: FilterSelect[];
}) {
  const active = Boolean(q) || selects.some((s) => s.value);
  return (
    <Form action={action} role="search" className="flex flex-wrap items-end gap-3">
      <div className="flex min-w-56 flex-1 flex-col gap-1.5">
        <label htmlFor="cari-admin" className="text-sm font-semibold">
          {searchLabel}
        </label>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="cari-admin"
            name="q"
            type="search"
            defaultValue={q}
            placeholder={placeholder}
            className="h-10 w-full rounded-lg border border-input bg-background pr-3 pl-9 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>
      {selects.map((s) => (
        <div key={s.name} className="flex min-w-40 flex-col gap-1.5">
          <label htmlFor={`filter-${s.name}`} className="text-sm font-semibold">
            {s.label}
          </label>
          <NativeSelect id={`filter-${s.name}`} name={s.name} defaultValue={s.value ?? ""}>
            <option value="">Semua</option>
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </div>
      ))}
      <div className="flex gap-2">
        <Button type="submit">Terapkan</Button>
        {active && (
          <Button asChild variant="ghost">
            <Link href={action}>Atur ulang</Link>
          </Button>
        )}
      </div>
    </Form>
  );
}

/** URL halaman berikutnya dengan filter yang sama. */
export function pageHref(base: string, params: Record<string, string | number | undefined>, page: number) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "" && k !== "page") sp.set(k, String(v));
  if (page > 1) sp.set("page", String(page));
  const s = sp.toString();
  return s ? `${base}?${s}` : base;
}
