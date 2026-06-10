"use client";

import type { View } from "@/app/page";

const NAV_LINKS: { label: string; view?: View; href?: string }[] = [
  { label: "Resume", href: "/michael_roberts_resume.pdf" },
  { label: "Projects", view: "projects" },
  { label: "Contact", view: "contact" },
];

export function Header({
  view,
  onViewChange,
  handle = "@devmikeroberts",
  resumeUrl,
}: {
  view: View;
  onViewChange: (v: View) => void;
  handle?: string;
  resumeUrl?: string;
}) {
  const links = resumeUrl
    ? [{ label: "Resume", href: resumeUrl }, ...NAV_LINKS.slice(1)]
    : NAV_LINKS;

  return (
    <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-3">
      <button
        onClick={() => onViewChange("home")}
        className="text-sm font-semibold tracking-tight text-white/60 transition-colors hover:text-white"
      >
        {handle}
      </button>
      <nav className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 backdrop-blur-xl border border-white/[0.06]">
        {links.map((link) =>
          link.href ? (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:text-white hover:bg-white/10"
            >
              {link.label}
            </a>
          ) : link.view ? (
            <button
              key={link.label}
              onClick={() => onViewChange(link.view!)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                view === link.view
                  ? "text-white bg-white/15"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {link.label}
            </button>
          ) : null,
        )}
      </nav>
    </header>
  );
}
