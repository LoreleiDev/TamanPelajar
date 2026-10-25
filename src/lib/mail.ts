// Pengiriman email. MAIL_MODE="log" (bawaan lokal dan demo) mencetak email ke log server
// dan mengembalikan tautannya agar alur demo bisa dilanjutkan dari halaman.
// TODO: tambahkan mode "smtp" (nodemailer) atau penyedia email saat produksi.

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  /** Tautan utama di email (verifikasi, reset); ditampilkan di halaman saat mode log. */
  link?: string;
}

export const isDemoMail = () => (process.env.MAIL_MODE ?? "log") === "log";

export async function sendMail(message: MailMessage): Promise<{ demoLink?: string }> {
  if (isDemoMail()) {
    console.info(`[mail:log] Kepada: ${message.to}\nSubjek: ${message.subject}\n\n${message.text}`);
    return { demoLink: message.link };
  }
  throw new Error(`MAIL_MODE "${process.env.MAIL_MODE}" belum didukung`);
}

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";

export function verificationMail(to: string, name: string, token: string): MailMessage {
  const link = `${appUrl()}/verifikasi-email?token=${encodeURIComponent(token)}`;
  return {
    to,
    subject: "Verifikasi email akun Taman Pelajar",
    link,
    text: `Halo ${name},\n\nBuka tautan berikut untuk memverifikasi email dan mengaktifkan akun Taman Pelajar:\n${link}\n\nTautan berlaku 24 jam. Jika kamu tidak merasa mendaftar, abaikan email ini.\n\nTaman Pelajar`,
  };
}

export function resetPasswordMail(to: string, name: string, token: string): MailMessage {
  const link = `${appUrl()}/reset-password/${encodeURIComponent(token)}`;
  return {
    to,
    subject: "Atur ulang password Taman Pelajar",
    link,
    text: `Halo ${name},\n\nKami menerima permintaan untuk mengatur ulang password akunmu. Buka tautan berikut untuk membuat password baru:\n${link}\n\nTautan berlaku 1 jam dan hanya bisa dipakai sekali. Jika kamu tidak meminta ini, abaikan email ini; password lama tetap berlaku.\n\nTaman Pelajar`,
  };
}

/** Hasil penilaian tugas praktik sertifikat (revisi RMED). */
export function practicalResultMail(
  to: string,
  name: string,
  input: { courseTitle: string; decision: "SETUJUI" | "REVISI" | "TOLAK"; note?: string; href: string; nextBatch?: string | null },
): MailMessage {
  const link = `${appUrl()}${input.href}`;
  const subject = {
    SETUJUI: `Sertifikat ${input.courseTitle} sudah terbit`,
    REVISI: `Tugas praktik ${input.courseTitle} perlu revisi`,
    TOLAK: `Hasil tugas praktik ${input.courseTitle}`,
  }[input.decision];
  const body = {
    SETUJUI: `Tugas praktikmu untuk kelas ${input.courseTitle} disetujui. Sertifikatmu sudah terbit dan bisa diunduh di tautan berikut:`,
    REVISI: `Tugas praktikmu untuk kelas ${input.courseTitle} perlu diperbaiki. Kirim ulang link tugas sebelum batch berakhir (kesempatan revisi hanya sekali).`,
    TOLAK: `Tugas praktikmu untuk kelas ${input.courseTitle} belum disetujui. Kamu bisa mengulang kelas ini secara gratis di batch berikutnya${input.nextBatch ? ` (${input.nextBatch})` : ""}.`,
  }[input.decision];
  const note = input.note ? `\n\nCatatan dari admin:\n${input.note}` : "";
  return { to, subject, link, text: `Halo ${name},\n\n${body}${note}\n\n${link}\n\nTaman Pelajar` };
}
