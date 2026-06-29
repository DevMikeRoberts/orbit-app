"use client";

import { useEffect, useRef, useState } from "react";
import type { UniversityResult } from "@/app/api/universities/search/route";
import type { ResolvedCity } from "@/lib/inferProfile";

export function UniversityPicker({
  onPick,
  placeholder = "Type a university…",
  autoFocus,
}: {
  onPick: (data: { university: string; city: ResolvedCity }) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UniversityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/universities/search?q=${encodeURIComponent(q)}`,
          { signal: ctrl.signal },
        );
        if (!res.ok) return;
        const { results } = await res.json();
        setResults(results);
        setActive(0);
      } catch {
        // ignore — likely aborted
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [query]);

  const pick = (r: UniversityResult) => {
    onPick({
      university: r.name,
      city: {
        city: r.city,
        country: r.country,
        lat: r.lat,
        lng: r.lng,
      },
    });
    setQuery("");
    setResults([]);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[active]) pick(results[active]);
    }
  };

  return (
    <div className="chat-university">
      <input
        ref={inputRef}
        type="text"
        className="chat-input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKey}
        autoComplete="off"
        spellCheck={false}
      />
      {query.trim().length >= 2 && (
        <ul className="chat-city-results" role="listbox">
          {loading ? (
            <li className="chat-city-empty">Looking…</li>
          ) : results.length === 0 ? (
            <li className="chat-city-empty">
              No matches — try a different name or enter it manually.
            </li>
          ) : (
            results.map((r, i) => (
              <li
                key={`${r.name}-${r.lat}-${r.lng}`}
                role="option"
                aria-selected={i === active}
                className={`chat-city-option ${i === active ? "is-active" : ""}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(r);
                }}
              >
                <span className="chat-city-name">{r.name}</span>
                <span className="chat-city-meta">{r.city}, {r.country}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
