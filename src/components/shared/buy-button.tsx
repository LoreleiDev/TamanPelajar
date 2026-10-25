"use client";

import { Settings2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { useRequireLogin } from "@/components/shared/require-login";
import { Button } from "@/components/ui/button";
import { tambahKeKeranjang } from "@/features/cart/actions";
import { cn } from "@/lib/utils";

/**
 * "Beli sekarang" (K.1): masukkan paket ke keranjang lalu buka keranjang. Tamu melihat
 * dialog masuk (C.5.3); server tetap memeriksa sesi dan status paket. Admin tidak membeli
 * paket, jadi tombolnya diganti tautan ke pengelolaan paket di panel admin.
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
  const { isAdmin, requireLogin } = useRequireLogin();
  const [pending, startTransition] = useTransition();
  if (isAdmin) {
    return (
      <Button asChild size={size} variant="outline" className={cn(className)}>
        <Link href="/admin/produk">
          <Settings2 aria-hidden="true" data-icon="inline-start" />
          Kelola paket
          <span className="sr-only"> {productName}</span>
        </Link>
      </Button>
    );
  }
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
