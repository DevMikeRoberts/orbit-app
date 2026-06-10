"use client";

import { useRef } from "react";
import * as THREE from "three";

const GLOBE_RADIUS = 1;

export function Atmosphere() {
  const ref = useRef<THREE.Mesh>(null);

  return (
    <mesh ref={ref} scale={[1.025, 1.025, 1.025]}>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <shaderMaterial
        vertexShader={`
          varying vec3 vNormalW;
          varying vec3 vPositionW;
          void main() {
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vNormalW = normalize(mat3(modelMatrix) * normal);
            vPositionW = worldPos.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPos;
          }
        `}
        fragmentShader={`
          varying vec3 vNormalW;
          varying vec3 vPositionW;
          void main() {
            vec3 viewDir = normalize(cameraPosition - vPositionW);
            float rim = 1.0 - max(dot(vNormalW, viewDir), 0.0);
            float glow = pow(rim, 2.4);
            vec3 inner = vec3(0.35, 0.55, 1.0);
            vec3 outer = vec3(0.55, 0.75, 1.0);
            vec3 col = mix(inner, outer, smoothstep(0.4, 1.0, rim));
            gl_FragColor = vec4(col, glow * 0.55);
          }
        `}
        transparent
        side={THREE.FrontSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
