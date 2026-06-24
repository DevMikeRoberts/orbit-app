"use client";

import { useMemo } from "react";
import { Html } from "@react-three/drei";
import { latLngToVector3 } from "@/lib/geo";

const GLOBE_RADIUS = 1;

export function LivePin({
  lat,
  lng,
  city,
  region,
  country,
  avatarUrl,
}: {
  lat: number;
  lng: number;
  city?: string;
  region?: string;
  country?: string;
  avatarUrl?: string;
}) {
  const { pos, cardPos } = useMemo(() => {
    const p = latLngToVector3(lat, lng, GLOBE_RADIUS);
    const radial = p.clone().normalize();
    const cp = p
      .clone()
      .add(radial.clone().multiplyScalar(GLOBE_RADIUS * 0.06));
    return { pos: p, cardPos: cp };
  }, [lat, lng]);

  const label = city
    ? [city, region, country].filter(Boolean).join(", ")
    : "";

  const avatarStyle = avatarUrl
    ? { backgroundImage: `url(${avatarUrl})` }
    : { backgroundImage: "url(/placeholder.jpg)" };

  return (
    <group>
      <mesh position={pos}>
        <sphereGeometry args={[0.003, 8, 8]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>

      <Html position={pos} center style={{ pointerEvents: "none" }}>
        <span className="live-globe-pin">📍</span>
      </Html>

      <Html position={cardPos} center>
        <div className="live-pin">
          <div className="live-avatar-wrapper">
            <div className="live-ping-ring" />
            <div className="live-ping-ring live-ping-ring--delay" />
            <div className="live-avatar" style={avatarStyle} />
          </div>
          {label && (
            <div className="live-text-bubble">
              <span className="live-subtitle">currently in</span>
              <span className="live-city">&nbsp;{label}</span>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}
