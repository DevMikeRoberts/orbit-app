"use client";

import type { View } from "@/components/ProfilePage";

export function ContactOverlay({
  view,
  onViewChange,
  email,
}: {
  view: View;
  onViewChange: (v: View) => void;
  email: string;
}) {
  const open = view === "contact";

  return (
    <div
      className={`fixed inset-0 z-20 transition-all duration-500 ease-out ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <aside
        className={`contact-panel ${open ? "is-open" : ""}`}
        role="dialog"
        aria-label="Contact"
      >
        <button
          className="panel-close"
          onClick={() => onViewChange("home")}
          aria-label="Close contact"
        >
          ✕
        </button>

        <div className="contact-mega">
          <a href={`mailto:${email}`} className="contact-mega-email">
            {email}
          </a>
        </div>
      </aside>
    </div>
  );
}
