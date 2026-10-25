import { Search } from "lucide-react";
import Form from "next/form";

import { Button } from "@/components/ui/button";

/** Kolom pencarian besar halaman daftar (katalog, video). Form GET, jalan tanpa JavaScript. */
export function SearchBar({ action, id, label, placeholder }: { action: string; id: string; label: string; placeholder: string }) {
  return (
    <Form action={action} role="search" className="flex max-w-2xl gap-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative flex-1">
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          name="q"
          type="search"
          placeholder={placeholder}
          className="h-12 w-full rounded-xl border border-input bg-background pr-3 pl-11 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      <Button type="submit" size="lg">
        Cari
      </Button>
    </Form>
  );
}
