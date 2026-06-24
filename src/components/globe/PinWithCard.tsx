"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Html, Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { latLngToVector3, vector3ToLatLng } from "@/lib/geo";
import type { ProfileLocation, SubEntry } from "@/types/profile";

const GLOBE_RADIUS = 1;
const CARD_RADIUS = GLOBE_RADIUS * 1.03;
const PIN_SIZES = [0.002, 0.003, 0.0015, 0.0025, 0.002];

function formatRoles(roles: string[]) {
  if (roles.length === 0) return "";
  if (roles.length === 1) return roles[0];
  if (roles.length === 2) return `${roles[0]} and ${roles[1]}`;
  return `${roles.slice(0, -1).join(", ")}, and ${roles[roles.length - 1]}`;
}

function intersectSphere(
  ray: THREE.Ray,
  radius: number,
): THREE.Vector3 | null {
  const O = ray.origin;
  const D = ray.direction;
  const a = D.lengthSq();
  const b = 2 * O.dot(D);
  const c = O.lengthSq() - radius * radius;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const t1 = (-b - Math.sqrt(disc)) / (2 * a);
  const t2 = (-b + Math.sqrt(disc)) / (2 * a);
  const t = t1 > 0 ? t1 : t2;
  if (t <= 0) return null;
  return O.clone().add(D.clone().multiplyScalar(t));
}

function wrapLng(d: number): number {
  let v = d;
  while (v > 180) v -= 360;
  while (v < -180) v += 360;
  return v;
}

export function PinWithCard({
  location,
  index,
  cardDelay = 0,
  isOwner = false,
  globeGroupRef,
  onDragStart,
  onDragEnd,
  onCommitOffset,
}: {
  location: ProfileLocation;
  index: number;
  cardDelay?: number;
  isOwner?: boolean;
  globeGroupRef?: React.RefObject<THREE.Group | null>;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onCommitOffset?: (
    locationId: string,
    offset: { dLat: number; dLng: number } | null,
  ) => void;
}) {
  const { camera, size } = useThree();
  const [dragOffset, setDragOffset] = useState<{
    dLat: number;
    dLng: number;
  } | null>(null);
  const dragOffsetRef = useRef<{ dLat: number; dLng: number } | null>(null);
  const grabDeltaRef = useRef<{ dLat: number; dLng: number }>({ dLat: 0, dLng: 0 });
  const draggingRef = useRef(false);
  const raycasterRef = useRef(new THREE.Raycaster());

  const effectiveOffset = dragOffset ?? location.cardOffset ?? null;

  const { pinPos, cardPos, points } = useMemo(() => {
    const pin = latLngToVector3(location.lat, location.lng, GLOBE_RADIUS);

    let card: THREE.Vector3;
    if (effectiveOffset) {
      card = latLngToVector3(
        location.lat + effectiveOffset.dLat,
        location.lng + effectiveOffset.dLng,
        CARD_RADIUS,
      );
    } else {
      const radial = pin.clone().normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const tangent = new THREE.Vector3().crossVectors(radial, up).normalize();
      if (tangent.length() < 0.001) tangent.set(1, 0, 0);

      const spread = location.spread ?? (index - 1) * 0.7;
      const baseCard = latLngToVector3(location.lat, location.lng, CARD_RADIUS);
      card = baseCard.clone().add(tangent.clone().multiplyScalar(spread));
    }

    const m = pin
      .clone()
      .lerp(card, 0.5)
      .normalize()
      .multiplyScalar(GLOBE_RADIUS * 1.03);

    const c = new THREE.QuadraticBezierCurve3(pin, m, card);
    const pts = c.getPoints(24);

    return { pinPos: pin, cardPos: card, points: pts };
  }, [
    location.lat,
    location.lng,
    index,
    location.spread,
    effectiveOffset,
  ]);

  const pinSize = PIN_SIZES[index % PIN_SIZES.length];
  const diamondRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (diamondRef.current) diamondRef.current.quaternion.copy(camera.quaternion);
  });

  // Compute the cursor's projected lat/lng (in the card sphere) relative to the pin.
  const computeCursorOffset = useCallback(
    (clientX: number, clientY: number): { dLat: number; dLng: number } | null => {
      const ndc = new THREE.Vector2(
        (clientX / size.width) * 2 - 1,
        -(clientY / size.height) * 2 + 1,
      );
      raycasterRef.current.setFromCamera(ndc, camera);
      const worldHit = intersectSphere(raycasterRef.current.ray, CARD_RADIUS);
      if (!worldHit) return null;
      const group = globeGroupRef?.current;
      const localHit = group
        ? group.worldToLocal(worldHit.clone())
        : worldHit;
      const { lat, lng } = vector3ToLatLng(localHit, CARD_RADIUS);
      return { dLat: lat - location.lat, dLng: wrapLng(lng - location.lng) };
    },
    [camera, size.width, size.height, globeGroupRef, location.lat, location.lng],
  );

  const setLiveOffset = useCallback((next: { dLat: number; dLng: number } | null) => {
    dragOffsetRef.current = next;
    setDragOffset(next);
  }, []);

  const finishDrag = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const committed = dragOffsetRef.current;
    setLiveOffset(null);
    onDragEnd?.();
    if (committed) onCommitOffset?.(location.id, committed);
  }, [location.id, onCommitOffset, onDragEnd, setLiveOffset]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isOwner) return;
    const cursor = computeCursorOffset(e.clientX, e.clientY);
    if (!cursor) return; // cursor missed the sphere — don't start a drag
    e.stopPropagation();
    e.preventDefault();
    // The card center currently sits at (location.lat + currentOffset.dLat, ...);
    // record grab-delta = cursorOffset - currentOffset so the card moves with
    // the cursor instead of teleporting to it.
    const current = location.cardOffset ?? null;
    grabDeltaRef.current = current
      ? { dLat: cursor.dLat - current.dLat, dLng: wrapLng(cursor.dLng - current.dLng) }
      : { dLat: 0, dLng: 0 };
    draggingRef.current = true;
    onDragStart?.();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    e.stopPropagation();
    const cursor = computeCursorOffset(e.clientX, e.clientY);
    if (!cursor) return;
    const grab = grabDeltaRef.current;
    setLiveOffset({
      dLat: cursor.dLat - grab.dLat,
      dLng: wrapLng(cursor.dLng - grab.dLng),
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    e.stopPropagation();
    finishDrag();
  };

  // Safety: if the pointer leaves the canvas or capture is lost, still commit.
  useEffect(() => {
    const onWinUp = () => {
      if (draggingRef.current) finishDrag();
    };
    window.addEventListener("pointerup", onWinUp);
    window.addEventListener("pointercancel", onWinUp);
    return () => {
      window.removeEventListener("pointerup", onWinUp);
      window.removeEventListener("pointercancel", onWinUp);
    };
  }, [finishDrag]);

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
        <div
          className={`card ${isOwner ? "card--draggable" : ""} ${draggingRef.current ? "card--dragging" : ""}`}
          style={{ animationDelay: `${cardDelay}s` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {isOwner && <div className="card-drag-handle" aria-hidden>⠿</div>}

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
