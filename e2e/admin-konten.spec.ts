import { expect, test, type Page } from "@playwright/test";

// Pengelolaan konten oleh admin (L.1, L.2.1–L.2.6, L.2.10, M.4, T.12, T.13). Konten uji
// dibuat per project dan dibersihkan oleh e2e/reset-db.ts.
test.describe.configure({ mode: "serial" });

async function masukAdmin(page: Page, path: string) {
  await page.goto(`/masuk?callbackUrl=${encodeURIComponent(path)}`);
  await page.getByLabel("Email").fill("admin@tamanpelajar.test");
  await page.getByLabel("Password", { exact: true }).fill("Demo12345!");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${path.replace(/[?]/g, "\\?")}$`));
}

test.describe("panel admin: konten (L, M.4)", () => {
  test("tambah lalu hapus program (M.1)", async ({ page }, info) => {
    const name = `Program Uji ${info.project.name}`;
    await masukAdmin(page, "/admin/program");
    await page.getByRole("button", { name: "Tambah program" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nama program").fill(name);
    await dialog.getByLabel("Nama program").blur();
    await expect(dialog.getByLabel("Slug URL")).toHaveValue(`program-uji-${info.project.name}`);
    await dialog.getByLabel("Slug URL").fill(`program-uji-admin-${info.project.name}`);
    await dialog.getByLabel("Nama singkat").fill("UJI");
    await dialog.getByLabel("Sasaran peserta").fill("Tim penguji otomatis");
    await dialog.getByLabel("Deskripsi").fill("Program sementara untuk pengujian panel admin.");
    await dialog.getByRole("button", { name: "Simpan program" }).click();
    const row = page.getByRole("row").filter({ hasText: name });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Hapus" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Hapus program" }).click();
    await expect(page.getByRole("row").filter({ hasText: name })).toHaveCount(0);
  });

  test("tambah video dari URL (L.2.4)", async ({ page }, info) => {
    await masukAdmin(page, "/admin/video/baru");
    await page.getByLabel("Judul").fill(`Video Uji Admin ${info.project.name}`);
    await page.getByLabel("Slug URL").fill(`video-uji-admin-${info.project.name}`);
    await page.getByLabel("URL video").fill("https://contoh.id/halaman");
    await page.getByLabel("Durasi").fill("12:30");
    await page.getByRole("textbox", { name: "Mata pelajaran" }).fill("Penalaran Umum");
    await page.getByLabel("Deskripsi").fill("Video uji untuk memastikan form video bekerja.");
    await page.getByRole("button", { name: "Tambah video" }).click();
    await expect(page.getByText(/Pakai URL YouTube, Vimeo/)).toBeVisible();
    await page.getByLabel("URL video").fill("https://www.youtube.com/watch?v=abcdEFG1234");
    await expect(page.getByText("Terdeteksi: YouTube.")).toBeVisible();
    await page.getByRole("button", { name: "Tambah video" }).click();
    await expect(page.getByText("Video ditambahkan.")).toBeVisible();
    await expect(page).not.toHaveURL(/\/baru$/);
    await expect(page.getByRole("heading", { level: 1, name: `Video Uji Admin ${info.project.name}` })).toBeVisible();
  });

  test("buat kelas, bab, materi bacaan dan video, tandai bab gratis (L.2.1–L.2.4, L.2.10)", async ({ page }, info) => {
    test.setTimeout(150_000);
    const slug = `kelas-uji-admin-${info.project.name}`;
    await masukAdmin(page, "/admin/kelas/baru");
    await page.getByLabel("Judul kelas").fill(`Kelas Uji Admin ${info.project.name}`);
    await page.getByLabel("Slug URL").fill(slug);
    await page.getByRole("textbox", { name: "Mata pelajaran" }).fill("Penalaran Umum");
    await page.getByLabel("Ringkasan").fill("Kelas sementara untuk pengujian panel admin.");
    await page.getByLabel("Deskripsi").fill("Kelas ini dibuat dan dihapus oleh tes otomatis.");
    await page.getByRole("button", { name: "Buat kelas" }).click();
    await expect(page).toHaveURL(/\/admin\/kelas\/[a-z0-9]{20,}\?tab=kurikulum$/);
    const courseUrl = page.url().split("?")[0];

    for (const title of ["Pengenalan", "Latihan", "Pendalaman"]) {
      await page.getByLabel("Bab baru").fill(title);
      await page.getByRole("button", { name: "Tambah bab" }).click();
      await expect(page.getByRole("heading", { name: new RegExp(`Bab \\d\\. ${title}`) })).toBeVisible();
    }
    // Bab 1–2 gratis secara bawaan; bab 3 tidak.
    const bab3 = page.getByRole("region", { name: /Bab 3: Pendalaman/ });
    await expect(bab3.getByRole("checkbox", { name: "Gratis" })).not.toBeChecked();
    await bab3.getByRole("checkbox", { name: "Gratis" }).check();
    await expect(page.getByText("Bab ditandai gratis.")).toBeVisible();

    const bab1 = page.getByRole("region", { name: /Bab 1: Pengenalan/ });
    await bab1.getByLabel("Materi baru").fill("Membaca soal dengan teliti");
    await bab1.getByLabel("Jenis").selectOption("TEKS");
    await bab1.getByRole("button", { name: "Tambah" }).click();
    await expect(page).toHaveURL(/\/materi\/[a-z0-9]{20,}$/);
    await page.getByRole("textbox", { name: "Isi bacaan" }).fill("<p>Baca kata kunci soal sebelum melihat pilihan jawaban.</p>");
    await page.getByRole("textbox", { name: "Perkiraan durasi (menit, opsional)" }).fill("5");
    await page.getByRole("button", { name: "Simpan materi" }).click();
    await expect(page.getByText("Materi disimpan.")).toBeVisible();
    // Tunggu toast pertama hilang agar toast simpanan berikutnya benar-benar baru.
    await expect(page.getByText("Materi disimpan.")).toHaveCount(0, { timeout: 15_000 });

    // Materi video wajib memilih video dari pustaka.
    await page.getByRole("combobox", { name: "Jenis", exact: true }).selectOption("VIDEO");
    await page.getByRole("button", { name: "Simpan materi" }).click();
    await expect(page.getByText("Pilih video dari pustaka")).toBeVisible();
    await page.getByRole("combobox", { name: "Video", exact: true }).selectOption({ label: `Penalaran Umum: Video Uji Admin ${info.project.name} (12:30)` });
    await page.getByRole("button", { name: "Simpan materi" }).click();
    await expect(page.getByText("Materi disimpan.")).toBeVisible();

    await page.goto(`${courseUrl}?tab=kurikulum`);
    await expect(page.getByRole("link", { name: "Membaca soal dengan teliti" })).toBeVisible();
    await expect(page.getByRole("region", { name: /Bab 1: Pengenalan/ })).toContainText(`video: Video Uji Admin ${info.project.name}`);
    // Bab kosong bisa dihapus.
    await page.getByRole("button", { name: "Hapus bab Latihan" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Hapus bab" }).click();
    await expect(page.getByRole("heading", { name: /Latihan/ })).toHaveCount(0);

    await page.getByRole("tab", { name: "Peserta" }).click();
    await expect(page.getByText("Belum ada peserta")).toBeVisible();
  });

  test("buat paket berisi kelas lalu hapus (M.4)", async ({ page }, info) => {
    await masukAdmin(page, "/admin/produk/baru");
    await page.getByLabel("Nama paket").fill(`Paket Uji Admin ${info.project.name}`);
    await page.getByLabel("Slug URL").fill(`paket-uji-admin-${info.project.name}`);
    await page.getByLabel("Ringkasan").fill("Paket sementara untuk pengujian panel admin.");
    await page.getByLabel("Deskripsi").fill("Paket ini dibuat dan dihapus oleh tes otomatis panel admin.");
    await page.getByLabel("Harga normal (Rp)").fill("100000");
    await page.getByLabel("Harga promo (Rp)").fill("150000");
    await page.getByLabel("Fitur paket").fill("Akses kelas uji\nPembahasan lengkap");
    await page.getByLabel("Status").selectOption("TERBIT");
    await page.getByRole("button", { name: "Buat paket" }).click();
    await expect(page.getByText("Harga promo harus lebih kecil dari harga normal")).toBeVisible();
    await expect(page.getByText(/Paket terbit harus memuat minimal satu/)).toBeVisible();

    await page.getByLabel("Harga promo (Rp)").fill("80000");
    await page.getByRole("group", { name: /^Kelas/ }).getByRole("checkbox", { name: new RegExp(`Kelas Uji Admin ${info.project.name}`) }).check();
    await page.getByRole("button", { name: "Tambah pertanyaan" }).click();
    await page.getByPlaceholder("Pertanyaan 1").fill("Berapa lama aksesnya?");
    await page.getByPlaceholder("Jawaban").fill("Sesuai masa aktif paket.");
    await page.getByRole("button", { name: "Buat paket" }).click();
    await expect(page).toHaveURL(/\/admin\/produk\/[a-z0-9]{20,}$/);
    await expect(page.getByRole("group", { name: /^Kelas/ }).getByRole("checkbox", { name: new RegExp(`Kelas Uji Admin ${info.project.name}`) })).toBeChecked();

    // Paket terbit langsung bisa dibuka di halaman publik.
    await page.goto(`/paket/paket-uji-admin-${info.project.name}`);
    await expect(page.getByRole("heading", { level: 1, name: `Paket Uji Admin ${info.project.name}` })).toBeVisible();
    await page.goBack();

    await page.getByRole("button", { name: "Hapus paket" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Hapus paket" }).click();
    await expect(page).toHaveURL(/\/admin\/produk$/);
  });
});
