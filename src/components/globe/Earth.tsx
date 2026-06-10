"use client";

import { useEffect } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

const GLOBE_RADIUS = 1;

export function Earth() {
  const { gl } = useThree();
  const [colorMap, emissiveMap] = useTexture([
    "https://unpkg.com/three-globe@2.24.13/example/img/earth-blue-marble.jpg",
    "https://unpkg.com/three-globe@2.24.13/example/img/earth-night.jpg",
  ]);

  useEffect(() => {
    const maxAniso = gl.capabilities.getMaxAnisotropy();
    for (const tex of [colorMap, emissiveMap]) {
      tex.anisotropy = maxAniso;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
    }
  }, [colorMap, emissiveMap, gl]);

  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
      <meshStandardMaterial
        map={colorMap}
        emissiveMap={emissiveMap}
        emissive="#ffaa55"
        emissiveIntensity={0.55}
        roughness={0.82}
        metalness={0.05}
      />
    </mesh>
  );
}
