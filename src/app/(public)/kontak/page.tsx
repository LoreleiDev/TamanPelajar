import type { Metadata } from "next";

import { contact } from "@/components/layout/nav-items";
import { InfoPage } from "@/components/shared/info-page";

export const metadata: Metadata = {
  title: "Kontak",
  description: "Cara menghubungi tim Taman Pelajar.",
};

const link = "font-semibold text-primary underline underline-offset-4";

export default function KontakPage() {
  return (
    <InfoPage
      title="Hubungi kami"
      intro="Kami membalas pesan pada hari kerja. Untuk pertanyaan pembayaran, sertakan nomor pesanan agar bisa langsung dicek."
      sections={[
        {
          id: "email",
          title: "Email",
          body: (
            <p>
              <a href={`mailto:${contact.email}`} className={link}>
                {contact.email}
              </a>{" "}
              untuk pertanyaan akun, pembayaran, materi, dan kerja sama.
            </p>
          ),
        },
        {
          id: "media-sosial",
          title: "Media sosial",
          body: (
            <ul>
              <li>
                Instagram:{" "}
                <a href={contact.instagram.href} target="_blank" rel="noopener noreferrer" className={link}>
                  {contact.instagram.handle}
                </a>
              </li>
              <li>
                Facebook:{" "}
                <a href={contact.facebook.href} target="_blank" rel="noopener noreferrer" className={link}>
                  {contact.facebook.handle}
                </a>
              </li>
              <li>
                Situs web:{" "}
                <a href={contact.website.href} target="_blank" rel="noopener noreferrer" className={link}>
                  {contact.website.handle}
                </a>
              </li>
            </ul>
          ),
        },
        {
          id: "jam",
          title: "Jam layanan",
          body: <p>Senin sampai Jumat, pukul 09.00–17.00 WIB. Pesan di luar jam itu dibalas pada hari kerja berikutnya.</p>,
        },
      ]}
    />
  );
}
