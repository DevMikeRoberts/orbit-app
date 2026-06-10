"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function FadeIn({
  delay = 0,
  duration = 0.8,
  children,
}: {
  delay?: number;
  duration?: number;
  children: React.ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const startTime = useRef<number | null>(null);
  const done = useRef(false);
  const baseOpacity = useRef(new WeakMap<THREE.Material, number>());

  useFrame(({ clock }) => {
    if (done.current || !groupRef.current) return;
    if (startTime.current === null) startTime.current = clock.getElapsedTime();

    const elapsed = clock.getElapsedTime() - startTime.current - delay;
    if (elapsed < 0) return;

    const t = Math.min(1, elapsed / duration);

    groupRef.current.traverse((child) => {
      if (!("material" in child)) return;
      const mat = (child as THREE.Mesh).material;
      if (!mat) return;
      const materials = Array.isArray(mat) ? mat : [mat];
      for (const m of materials) {
        // ShaderMaterials don't honor `opacity` automatically — skip them.
        // Materials may opt out by setting userData.skipFade = true.
        if (m instanceof THREE.ShaderMaterial) continue;
        if (m.userData?.skipFade) continue;
        let base = baseOpacity.current.get(m);
        if (base === undefined) {
          base = m.opacity;
          baseOpacity.current.set(m, base);
        }
        m.transparent = true;
        m.opacity = base * t;
      }
    });

    if (t >= 1) done.current = true;
  });

  return <group ref={groupRef}>{children}</group>;
}
