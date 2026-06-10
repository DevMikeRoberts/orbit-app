"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Html, Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { latLngToVector3 } from "@/lib/geo";
import type { ProfileLocation, SubEntry } from "@/types/profile";

const GLOBE_RADIUS = 1;
const PIN_SIZES = [0.002, 0.003, 0.0015, 0.0025, 0.002];

function formatRoles(roles: string[]) {
  if (roles.length === 0) return "";
  if (roles.length === 1) return roles[0];
  if (roles.length === 2) return `${roles[0]} and ${roles[1]}`;
  return `${roles.slice(0, -1).join(", ")}, and ${roles[roles.length - 1]}`;
}

export function PinWithCard({
  location,
  index,
  cardDelay = 0,
}: {
  location: ProfileLocation;
  index: number;
  cardDelay?: number;
}) {
  const { pinPos, cardPos, points } = useMemo(() => {
    const pin = latLngToVector3(location.lat, location.lng, GLOBE_RADIUS);

    const radial = pin.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const tangent = new THREE.Vector3().crossVectors(radial, up).normalize();
    if (tangent.length() < 0.001) tangent.set(1, 0, 0);

    const spread = location.spread ?? (index - 1) * 0.7;
    const cardRadius = GLOBE_RADIUS * 1.03;
    const baseCard = latLngToVector3(location.lat, location.lng, cardRadius);
    const card = baseCard.clone().add(tangent.clone().multiplyScalar(spread));

    const m = pin
      .clone()
      .lerp(card, 0.5)
      .normalize()
      .multiplyScalar(GLOBE_RADIUS * 1.03);

    const c = new THREE.QuadraticBezierCurve3(pin, m, card);
    const pts = c.getPoints(24);

    return { pinPos: pin, cardPos: card, points: pts };
  }, [location.lat, location.lng, index, location.spread]);

  const pinSize = PIN_SIZES[index % PIN_SIZES.length];
  const diamondRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (diamondRef.current) diamondRef.current.quaternion.copy(camera.quaternion);
  });

  const workEntries = location.subEntries.filter((e: SubEntry) => e.company);
  const otherEntries = location.subEntries.filter((e: SubEntry) => !e.company);
  const companies = [...new Set(workEntries.map((e: SubEntry) => e.company!))];
  const fallbackLogo = workEntries.find((e: SubEntry) => e.logo)?.logo;

  return (
    <group>
      <mesh position={pinPos}>
        <sphereGeometry args={[pinSize * 4, 12, 12]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.1}
          depthWrite={false}
        />
      </mesh>

      <mesh position={pinPos}>
        <sphereGeometry args={[pinSize * 2, 12, 12]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </mesh>

      <mesh position={pinPos}>
        <sphereGeometry args={[pinSize, 12, 12]} />
        <meshBasicMaterial color="#60a5fa" />
      </mesh>

      <Line
        points={points}
        color="#60a5fa"
        transparent
        opacity={0.35}
        dashed
        dashSize={0.025}
        gapSize={0.02}
        lineWidth={1.2}
      />

      <mesh ref={diamondRef} position={cardPos}>
        <circleGeometry args={[0.015, 4]} />
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </mesh>

      <Html position={cardPos} center>
        <div className="card" style={{ animationDelay: `${cardDelay}s` }}>
          <span className="card-city">{location.city}</span>

          {companies.map((company: string) => {
            const entries = workEntries.filter((e: SubEntry) => e.company === company);
            const entryLogo = entries.find((e: SubEntry) => e.logo)?.logo || fallbackLogo;
            return (
              <div key={company} className="card-company-section">
                {entryLogo ? (
                  <div className="card-company-row">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={entryLogo} alt="" className="card-company-logo" />
                    <span className="card-company-name">{company}</span>
                  </div>
                ) : (
                  <span className="card-company-name">{company}</span>
                )}
                <div className="card-work-entries">
                  <span className="card-work-title">
                    worked as a{" "}
                    <strong>{formatRoles(entries.map((e: SubEntry) => e.role))}</strong>
                  </span>
                </div>
              </div>
            );
          })}

          {otherEntries.map((entry: SubEntry, i: number) => (
            <div key={i} className="card-sub-entry">
              <div className="card-sub-header">
                <span className="card-emoji">{entry.emoji}</span>
                <div className="card-body">
                  <p className="card-role">{entry.role}</p>
                  <span className="card-place">{entry.place}</span>
                  <span className="card-date">{entry.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Html>
    </group>
  );
}
