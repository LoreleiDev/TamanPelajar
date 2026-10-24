"use client";

import { ShoppingBag } from "lucide-react";

import { useRequireLogin } from "@/components/shared/require-login";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * "Beli Sekarang". Tamu melihat dialog masuk (C.5.3). Untuk pengguna yang sudah masuk,
 * alur keranjang dan checkout disambungkan di Tahap 4 (K.1).
 */
export function BuyButton({
  productName,
  size = "default",
  variant = "default",
  className,
}: {
  productName: string;
  size?: "default" | "lg";
  variant?: "default" | "inverse";
  className?: string;
}) {
  const { requireLogin } = useRequireLogin();
  return (
    <Button
      size={size}
      variant={variant}
      className={cn(className)}
      onClick={() => requireLogin(`Untuk membeli ${productName}, masuk ke akun Anda terlebih dahulu.`)}
    >
      <ShoppingBag aria-hidden="true" data-icon="inline-start" />
      Beli sekarang
    </Button>
  );
}
