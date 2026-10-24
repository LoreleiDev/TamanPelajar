// Ilustrasi hero sementara: tunas dari logo yang tumbuh dari gundukan tanah, di dalam
// lingkaran garis tipis. Dekoratif (aria-hidden).
// TODO: ilustrasi pelajar (D.1.1) bila aset ilustrasi sudah tersedia.
export function HeroIllustration() {
  return (
    <svg viewBox="0 0 400 400" aria-hidden="true" focusable="false" className="h-auto w-full max-w-sm">
      <circle cx="200" cy="200" r="172" fill="rgb(255 255 255 / 0.06)" stroke="rgb(255 255 255 / 0.28)" strokeWidth="1.5" />
      <circle cx="200" cy="200" r="132" fill="none" stroke="rgb(255 255 255 / 0.14)" strokeWidth="1.5" />
      <ellipse cx="200" cy="320" rx="118" ry="16" fill="rgb(255 255 255 / 0.14)" />
      <path d="M200 320C201 282 198 246 200 200" stroke="#ffffff" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M198 238C148 242 98 212 82 150c58-10 110 22 116 88Z" fill="#ffffff" />
      <path d="M202 202c4-68 50-118 122-122 0 74-50 120-122 122Z" fill="var(--brand-leaf)" />
      <path
        d="M188 226c-28-16-58-38-84-66M214 190c26-26 56-58 90-88"
        stroke="var(--brand-primary)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />
      <g fill="rgb(255 255 255 / 0.4)">
        {[0, 1, 2, 3].map((col) =>
          [0, 1, 2].map((row) => <circle key={`${col}-${row}`} cx={300 + col * 16} cy={286 + row * 16} r="3" />),
        )}
      </g>
    </svg>
  );
}
