import { BookOpen, ClipboardList, Compass, PlayCircle } from "lucide-react";
import Link from "next/link";

// Menu belajar cepat (D.1.2): empat pill.
const items = [
  { href: "/tryout", label: "Tryout", icon: ClipboardList },
  { href: "/video", label: "Video belajar", icon: PlayCircle },
  { href: "/kelas", label: "Kelas online", icon: BookOpen },
  { href: "/program", label: "Pilih program", icon: Compass },
];

export function QuickMenu() {
  return (
    <nav aria-label="Menu belajar cepat" className="page-container -mt-6 relative z-10 lg:-mt-7">
      <ul className="flex flex-wrap gap-2 sm:gap-3">
        {items.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-background px-5 font-semibold text-foreground transition-colors duration-150 hover:border-primary hover:text-primary lg:h-14 lg:px-6 lg:text-lg"
            >
              <Icon aria-hidden="true" className="size-5 text-primary" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
