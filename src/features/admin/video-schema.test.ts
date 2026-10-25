import { describe, expect, it } from "vitest";

import { detectProvider, parseClock } from "./video-schema";

describe("form video", () => {
  it("mengenali penyedia dari URL", () => {
    expect(detectProvider("https://www.youtube.com/watch?v=abcdEFG123")).toBe("YOUTUBE");
    expect(detectProvider("https://youtu.be/abcdEFG123")).toBe("YOUTUBE");
    expect(detectProvider("https://vimeo.com/123456")).toBe("VIMEO");
    expect(detectProvider("https://cdn.contoh.id/video/materi.mp4")).toBe("EKSTERNAL");
    expect(detectProvider("http://youtu.be/abcdEFG123")).toBeNull();
    expect(detectProvider("https://contoh.id/halaman")).toBeNull();
  });

  it("membaca durasi menit:detik, jam:menit:detik, atau menit saja", () => {
    expect(parseClock("12:05")).toBe(725);
    expect(parseClock("1:02:05")).toBe(3725);
    expect(parseClock("15")).toBe(900);
    expect(parseClock("12:75")).toBeNull();
    expect(parseClock("dua belas")).toBeNull();
  });
});
