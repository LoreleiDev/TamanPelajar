/** Tautan "Lewati ke konten" untuk pengguna keyboard (Q.1.2). Target: elemen #konten. */
export function SkipLink() {
  return (
    <a
      href="#konten"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
    >
      Lewati ke konten
    </a>
  );
}
