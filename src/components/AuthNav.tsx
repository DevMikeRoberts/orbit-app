"use client";

import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/lib/auth-actions";

export interface AuthNavUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function AuthNav({ user }: { user: AuthNavUser | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!user) {
    return (
      <div className="auth-nav">
        <a href="/signin" className="auth-nav-signin">
          Sign in
        </a>
      </div>
    );
  }

  const name = user.name?.trim() || user.email?.split("@")[0] || "You";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="auth-nav" ref={ref}>
      <button
        className="auth-nav-pill"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="auth-nav-avatar" />
        ) : (
          <span className="auth-nav-initial">{initial}</span>
        )}
        <span className="auth-nav-name">{name}</span>
        <span className="auth-nav-chevron">▾</span>
      </button>
      {open && (
        <div className="auth-nav-menu">
          <a href="/dashboard" className="auth-nav-item">
            My globes
          </a>
          <a href="/create" className="auth-nav-item">
            Create another
          </a>
          <form action={signOutAction}>
            <button
              type="submit"
              className="auth-nav-item auth-nav-item--danger"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
