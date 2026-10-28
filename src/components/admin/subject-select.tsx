import type { ComponentProps } from "react";

import { NativeSelect } from "@/features/auth/components/native-select";

/**
 * Pilihan mata pelajaran dari daftar admin (revisi RMED). Nilai lama yang belum ada di daftar
 * tetap ditampilkan agar form ubah tidak kehilangan datanya; server menolaknya saat disimpan.
 */
export function SubjectSelect({ subjects, current, ...props }: ComponentProps<"select"> & { subjects: string[]; current?: string }) {
  const legacy = current && !subjects.some((s) => s.toLowerCase() === current.toLowerCase()) ? current : null;
  return (
    <NativeSelect {...props}>
      <option value="">Pilih mata pelajaran</option>
      {subjects.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
      {legacy && <option value={legacy}>{legacy} (belum terdaftar)</option>}
    </NativeSelect>
  );
}
