"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Daftar yang bisa diurutkan dengan seret-dan-lepas (L.2.2) atau keyboard: fokus pegangan,
 * Spasi untuk mengangkat, panah atas/bawah untuk memindah, Spasi lagi untuk meletakkan.
 */
export function SortableList<T extends { id: string }>({
  items,
  label,
  itemLabel,
  disabled = false,
  onReorder,
  renderItem,
  className,
}: {
  items: T[];
  /** Nama daftar untuk pembaca layar. */
  label: string;
  itemLabel: (item: T) => string;
  disabled?: boolean;
  /** Dipanggil dengan urutan ID baru; kembalikan false untuk membatalkan perubahan. */
  onReorder: (ids: string[]) => Promise<boolean>;
  renderItem: (item: T, handle: ReactNode) => ReactNode;
  className?: string;
}) {
  // ID stabil: tanpa ini ID aksesibilitas dnd-kit berbeda antara server dan client (hydration mismatch).
  const dndId = useId();
  const [order, setOrder] = useState(items);
  const [prevItems, setPrevItems] = useState(items);
  // Data baru dari server (setelah refresh) menggantikan urutan lokal.
  if (items !== prevItems) {
    setPrevItems(items);
    setOrder(items);
  }
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const name = (id: string | number) => {
    const it = order.find((i) => i.id === id);
    return it ? itemLabel(it) : "item";
  };
  const pos = (id: string | number) => order.findIndex((i) => i.id === id) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `${name(active.id)} diangkat, posisi ${pos(active.id)} dari ${order.length}.`,
    onDragOver: ({ active, over }) => (over ? `${name(active.id)} dipindah ke posisi ${pos(over.id)}.` : `${name(active.id)} di luar daftar.`),
    onDragEnd: ({ active, over }) => (over ? `${name(active.id)} diletakkan di posisi ${pos(over.id)}.` : `${name(active.id)} dikembalikan.`),
    onDragCancel: ({ active }) => `Batal. ${name(active.id)} dikembalikan.`,
  };

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = order.findIndex((i) => i.id === active.id);
    const to = order.findIndex((i) => i.id === over.id);
    const prev = order;
    const next = arrayMove(order, from, to);
    setOrder(next);
    if (!(await onReorder(next.map((i) => i.id)))) setOrder(prev);
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{
        announcements,
        screenReaderInstructions: { draggable: "Tekan Spasi untuk mengangkat. Panah atas atau bawah untuk memindah, Spasi untuk meletakkan, Escape untuk batal." },
      }}
    >
      <SortableContext items={order.map((i) => i.id)} strategy={verticalListSortingStrategy} disabled={disabled}>
        <ol aria-label={label} className={cn("flex flex-col", className)}>
          {order.map((item) => (
            <SortableRow key={item.id} id={item.id} label={itemLabel(item)} disabled={disabled}>
              {(handle) => renderItem(item, handle)}
            </SortableRow>
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ id, label, disabled, children }: { id: string; label: string; disabled: boolean; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const handle = disabled ? null : (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Pindahkan ${label}`}
      className="grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground active:cursor-grabbing"
    >
      <GripVertical aria-hidden="true" className="size-4" />
    </button>
  );
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative bg-background", isDragging && "z-10 shadow-soft")}
    >
      {children(handle)}
    </li>
  );
}
