"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useKonami } from "@/context/KonamiContext";

export function HaloRing() {
  const { activated } = useKonami();
  const ref = useRef<THREE.Mesh>(null);
  const progress = useRef(0);

  useFrame((_, delta) => {
    if (!ref.current) return;
    if (activated && progress.current < 1) {
      progress.current = Math.min(1, progress.current + delta * 0.5);
    }
    const s = progress.current;
    ref.current.scale.setScalar(s);
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = s * 0.6;
    ref.current.rotation.z += delta * 0.15;
  });

  return (
    <mesh
      ref={ref}
      rotation-x={Math.PI * 0.5}
      scale={0}
    >
      <torusGeometry args={[1.15, 0.008, 16, 120]} />
      <meshBasicMaterial
        color="#00ff88"
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
