"use client";

import { useEffect, useRef } from "react";
import { useKonami } from "@/context/KonamiContext";

const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

export function EasterEgg() {
  const { activate } = useKonami();
  const seq = useRef<string[]>([]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      seq.current = [...seq.current.slice(-9), e.key];
      if (
        seq.current.length === KONAMI.length &&
        seq.current.every((k, i) => k.toLowerCase() === KONAMI[i].toLowerCase())
      ) {
        seq.current = [];
        activate();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activate]);

  return null;
}
