import * as THREE from "three";

export function latLngToVector3(
  lat: number,
  lng: number,
  radius: number,
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

export function vector3ToLatLng(
  v: THREE.Vector3,
  radius: number,
): { lat: number; lng: number } {
  const r = radius || v.length() || 1;
  const phi = Math.acos(Math.min(1, Math.max(-1, v.y / r)));
  const theta = Math.atan2(v.z, -v.x);
  const lat = 90 - phi * (180 / Math.PI);
  const lng = ((theta * (180 / Math.PI) - 180 + 540) % 360) - 180;
  return { lat, lng };
}
