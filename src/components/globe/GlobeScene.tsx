"use client";

import { Suspense, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import { Earth } from "./Earth";
import { Atmosphere } from "./Atmosphere";
import { Stars } from "./Stars";
import { Clouds } from "./Clouds";
import { PinWithCard } from "./PinWithCard";
import { HaloRing } from "./HaloRing";
import { LivePin } from "./LivePin";
import { FadeIn } from "./FadeIn";
import { useKonami } from "@/context/KonamiContext";
import type { View } from "@/components/ProfilePage";
import type { ProfileLocation } from "@/types/profile";

function SceneContent({
  view,
  locations,
  liveLocation,
}: {
  view: View;
  locations: ProfileLocation[];
  liveLocation?: { lat: number; lng: number };
}) {
  const globeGroupRef = useRef<THREE.Group>(null);
  const spinProgress = useRef(0);
  const { activated } = useKonami();
  const didLog = useRef(false);

  useFrame((_, delta) => {
    if (!globeGroupRef.current) return;

    if (activated) {
      if (spinProgress.current < 1) {
        spinProgress.current = Math.min(1, spinProgress.current + delta * 1.5);
        globeGroupRef.current.rotation.y += delta * 8 * (1 - spinProgress.current);
      }
      if (!didLog.current) {
        didLog.current = true;
        console.log("117");
        console.log("Finish the Fight");
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.55} color="#cfd9ff" />
      <hemisphereLight args={["#bccfff", "#10131f", 0.6]} />
      <directionalLight
        position={[2.5, 1.2, 4]}
        intensity={3.2}
        color="#fff4e6"
      />

      <OrbitControls
        autoRotate={view === "home"}
        autoRotateSpeed={0.15}
        enablePan={false}
        enableZoom={view === "home"}
        enableRotate={view === "home"}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.55}
        zoomSpeed={0.6}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI * 0.85}
        minDistance={2.0}
        maxDistance={4.0}
      />

      <Stars />

      <group
        ref={globeGroupRef}
        rotation={[Math.PI * 0.13, Math.PI * -0.03, 0]}
      >
        <FadeIn delay={0.3} duration={0.8}>
          <Suspense fallback={null}>
            <Earth />
          </Suspense>
        </FadeIn>

        <Clouds />

        <Atmosphere />

        <HaloRing />

        <FadeIn delay={1.2} duration={0.5}>
          {locations.map((location, i) => (
            <PinWithCard
              key={location.id}
              location={location}
              index={i}
              cardDelay={1.8 + i * 0.15}
            />
          ))}
          {liveLocation && (
            <LivePin lat={liveLocation.lat} lng={liveLocation.lng} />
          )}
        </FadeIn>
      </group>
    </>
  );
}

export function GlobeScene({
  view,
  locations,
  liveLocation,
  fill = "viewport",
}: {
  view: View;
  locations: ProfileLocation[];
  liveLocation?: { lat: number; lng: number };
  fill?: "viewport" | "container";
}) {
  const wrapperClass =
    fill === "container" ? "absolute inset-0" : "fixed inset-0";
  return (
    <div className={wrapperClass}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [-0.32, 0.63, 2.6], fov: 35 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          powerPreference: "high-performance",
        }}
      >
        <SceneContent view={view} locations={locations} liveLocation={liveLocation} />
      </Canvas>
    </div>
  );
}
