"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface KonamiCtx {
  activated: boolean;
  activate: () => void;
}

const KonamiCtx = createContext<KonamiCtx>({
  activated: false,
  activate: () => {},
});

export function KonamiProvider({ children }: { children: ReactNode }) {
  const [activated, setActivated] = useState(false);
  const activate = useCallback(() => setActivated(true), []);
  return (
    <KonamiCtx.Provider value={{ activated, activate }}>
      {children}
    </KonamiCtx.Provider>
  );
}

export const useKonami = () => useContext(KonamiCtx);
