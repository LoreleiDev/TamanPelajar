"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { hapusDariKeranjang } from "@/features/cart/actions";

export function RemoveFromCart({ productId, name }: { productId: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const r = await hapusDariKeranjang({ productId });
          if (!r.ok) return void toast.error(r.error);
          toast.success(`${name} dihapus dari keranjang.`);
          router.refresh();
        })
      }
    >
      <Trash2 aria-hidden="true" data-icon="inline-start" />
      Hapus<span className="sr-only"> {name}</span>
    </Button>
  );
}
