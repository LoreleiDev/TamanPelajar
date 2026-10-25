import { describe, expect, it } from "vitest";

import { deliveryFor, uploadRejection } from "./media";

describe("aturan upload", () => {
  it("gambar: format dan ukuran", () => {
    expect(uploadRejection({ folder: "produk", kind: "image", format: "png", bytes: 1000 })).toBeNull();
    expect(uploadRejection({ folder: "produk", kind: "image", format: "svg", bytes: 1000 })).toMatch(/JPG/);
    expect(uploadRejection({ folder: "produk", kind: "image", format: "jpg", bytes: 6 * 1024 * 1024 })).toMatch(/5 MB/);
  });

  it("PDF: hanya pdf sampai 20 MB, delivery authenticated", () => {
    expect(uploadRejection({ folder: "kelas", kind: "pdf", format: "pdf", bytes: 19 * 1024 * 1024 })).toBeNull();
    expect(uploadRejection({ folder: "kelas", kind: "pdf", format: "docx", bytes: 10 })).toMatch(/PDF/);
    expect(uploadRejection({ folder: "kelas", kind: "pdf", format: "pdf", bytes: 21 * 1024 * 1024 })).toMatch(/20 MB/);
    expect(deliveryFor({ kind: "pdf" })).toBe("authenticated");
    expect(deliveryFor({ kind: "image" })).toBe("upload");
  });
});
