// Membuat video contoh orisinal per kelas tanpa ffmpeg: animasi canvas dirender di Chromium
// (Playwright), direkam dengan MediaRecorder (WebM), lalu diunggah ke Cloudinary sebagai
// video publik. Jalankan sekali: pnpm seed:video. Seed lalu memakai URL video ini.
// TODO: ganti dengan video pembelajaran asli yang diunggah admin.

import "dotenv/config";

import { chromium } from "@playwright/test";
import { v2 as cloudinary } from "cloudinary";

import { courses } from "./catalog";

export const SAMPLE_VIDEO_SECONDS = 24;

const folder = `${process.env.CLOUDINARY_UPLOAD_FOLDER ?? "tamanpelajar"}/kelas`;

async function main() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Isi variabel CLOUDINARY_* di .env terlebih dahulu.");
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent("<canvas width='1280' height='720'></canvas>");
  // tsx/esbuild menyisipkan helper __name ke fungsi yang dikirim ke browser; sediakan versi kosongnya.
  await page.evaluate("window.__name = (fn) => fn");

  for (const course of courses) {
    console.log(`Merekam ${course.title}…`);
    const base64 = await page.evaluate(
      async ({ title, subject, chapters, seconds }) => {
        const canvas = document.querySelector("canvas")!;
        const ctx = canvas.getContext("2d")!;
        const W = canvas.width;
        const H = canvas.height;
        const font = "'Segoe UI', Arial, sans-serif";

        function sprout(x: number, y: number, s: number, grow: number) {
          ctx.save();
          ctx.translate(x, y);
          ctx.scale(s, s);
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 6;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -90 * grow);
          ctx.stroke();
          if (grow > 0.5) {
            const g = (grow - 0.5) * 2;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.ellipse(-34 * g, -80, 36 * g, 16 * g, -0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#A0C064";
            ctx.beginPath();
            ctx.ellipse(36 * g, -100, 40 * g, 18 * g, 0.7, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        function frame(t: number) {
          const grad = ctx.createLinearGradient(0, 0, W, H);
          grad.addColorStop(0, "#3F7042");
          grad.addColorStop(1, "#718A35");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = "rgba(255,255,255,0.08)";
          ctx.beginPath();
          ctx.arc(W - 120, 120, 260, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.font = `600 28px ${font}`;
          ctx.fillText("TAMAN PELAJAR", 80, 90);
          ctx.font = `400 26px ${font}`;
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.fillText(`Kelas ${subject}`, 80, 170);
          ctx.fillStyle = "#ffffff";
          ctx.font = `800 64px ${font}`;
          ctx.fillText(title.toUpperCase(), 80, 240);

          chapters.forEach((ch: string, i: number) => {
            const show = Math.min(1, Math.max(0, (t - 2 - i * 3) / 0.8));
            if (show <= 0) return;
            ctx.globalAlpha = show;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(96, 318 + i * 62, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#3F7042";
            ctx.font = `700 18px ${font}`;
            ctx.fillText(String(i + 1), 90, 324 + i * 62);
            ctx.fillStyle = "#ffffff";
            ctx.font = `500 30px ${font}`;
            ctx.fillText(ch, 126, 328 + i * 62);
            ctx.globalAlpha = 1;
          });

          ctx.fillStyle = "rgba(255,255,255,0.8)";
          ctx.font = `400 22px ${font}`;
          ctx.fillText("Video contoh. Materi lengkap diunggah oleh tim Taman Pelajar.", 80, H - 60);
          ctx.fillStyle = "rgba(255,255,255,0.25)";
          ctx.fillRect(80, H - 40, W - 160, 6);
          ctx.fillStyle = "#A0C064";
          ctx.fillRect(80, H - 40, (W - 160) * Math.min(1, t / seconds), 6);
          sprout(W - 220, H - 140, 1.6, Math.min(1, t / (seconds * 0.6)));
        }

        const stream = canvas.captureStream(30);
        const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8", videoBitsPerSecond: 2_500_000 });
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        const done = new Promise<void>((resolve) => (recorder.onstop = () => resolve()));
        recorder.start(1000);
        const start = performance.now();
        await new Promise<void>((resolve) => {
          const tick = () => {
            const t = (performance.now() - start) / 1000;
            frame(t);
            if (t >= seconds) return resolve();
            requestAnimationFrame(tick);
          };
          tick();
        });
        recorder.stop();
        await done;
        const buf = new Uint8Array(await new Blob(chunks, { type: "video/webm" }).arrayBuffer());
        let binary = "";
        for (let i = 0; i < buf.length; i += 0x8000) binary += String.fromCharCode(...buf.subarray(i, i + 0x8000));
        return btoa(binary);
      },
      { title: course.title, subject: course.subject, chapters: course.chapters.map((c) => c.title), seconds: SAMPLE_VIDEO_SECONDS },
    );

    const r = await cloudinary.uploader.upload(`data:video/webm;base64,${base64}`, {
      resource_type: "video",
      public_id: `${folder}/video-${course.slug}`,
      overwrite: true,
    });
    console.log(`  ${r.public_id} (${Math.round(r.bytes / 1024)} KB, ${r.duration ?? "?"} detik)`);
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
