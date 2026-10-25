"use client";

import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { useRequireLogin } from "@/components/shared/require-login";
import { Button } from "@/components/ui/button";
import { tambahKeKeranjang } from "@/features/cart/actions";
import { cn } from "@/lib/utils";

/**
 * "Beli sekarang" (K.1): masukkan paket ke keranjang lalu buka keranjang. Tamu melihat
 * dialog masuk (C.5.3); server tetap memeriksa sesi dan status paket.
 */
export function BuyButton({
  productSlug,
  productName,
  size = "default",
  variant = "default",
  className,
}: {
  productSlug: string;
  productName: string;
  size?: "default" | "lg";
  variant?: "default" | "inverse";
  className?: string;
}) {
  const router = useRouter();
  const { requireLogin } = useRequireLogin();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size={size}
      variant={variant}
      className={cn(className)}
      disabled={pending}
      onClick={() =>
        requireLogin(`Untuk membeli ${productName}, masuk ke akun Anda terlebih dahulu.`, () =>
          startTransition(async () => {
            const r = await tambahKeKeranjang({ slug: productSlug });
            if (!r.ok) return void toast.error(r.error);
            router.push("/keranjang");
          }),
        )
      }
    >
      <ShoppingBag aria-hidden="true" data-icon="inline-start" />
      {pending ? "Memasukkan…" : "Beli sekarang"}
      <span className="sr-only"> {productName}</span>
    </Button>
  );
}
