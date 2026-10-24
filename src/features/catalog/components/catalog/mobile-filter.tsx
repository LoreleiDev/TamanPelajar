"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { CatalogFilter, Category } from "@/features/catalog/types";

import { FilterForm } from "./filter-form";

/** Filter di layar kecil: sheet dari bawah, diterapkan lewat tombol. */
export function MobileFilter({
  filter,
  categories,
  activeCount,
}: {
  filter: CatalogFilter;
  categories: (Pick<Category, "slug" | "name"> & { productCount: number })[];
  activeCount: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="lg:hidden">
          <SlidersHorizontal data-icon="inline-start" />
          Filter
          {activeCount > 0 && (
            <span className="ml-1 grid size-5 place-items-center rounded-full bg-primary text-xs text-white tabular-nums">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85svh] gap-0 rounded-t-2xl p-0">
        <SheetHeader className="p-4 pb-2">
          <SheetTitle className="text-lg">Filter program</SheetTitle>
          <SheetDescription>Pilih lalu tekan Terapkan filter.</SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto px-4 pb-6" onSubmit={() => setOpen(false)}>
          <FilterForm id="filter-mobile" filter={filter} categories={categories} autoSubmit={false} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
