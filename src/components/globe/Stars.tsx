"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useKonami } from "@/context/KonamiContext";

const COUNT = 1200;
const FADE_IN_DURATION = 1.0;

const VERTEX_SHADER = /* glsl */ `
  attribute vec3 iPosition;
  attribute float iSize;
  attribute float iPhase;

  uniform mat4 prevViewMatrix;
  uniform float aspect;
  uniform float streakAmount;
  uniform float maxStreak;
  uniform float time;

  varying float vTwinkle;
  varying vec2 vUv;

  void main() {
    vec4 viewCurr = viewMatrix * vec4(iPosition, 1.0);
    vec4 viewPrev = prevViewMatrix * vec4(iPosition, 1.0);

    vec4 clipCurr = projectionMatrix * viewCurr;
    vec4 clipPrev = projectionMatrix * viewPrev;

    float wC = max(clipCurr.w, 0.0001);
    float wP = max(clipPrev.w, 0.0001);
    vec2 ndcCurr = clipCurr.xy / wC;
    vec2 ndcPrev = clipPrev.xy / wP;

    // Aspect-corrected screen-space motion since last frame.
    vec2 motionAspect = (ndcCurr - ndcPrev) * vec2(aspect, 1.0);
    float motionLen = length(motionAspect);
    vec2 dir = motionLen > 1e-5 ? motionAspect / motionLen : vec2(1.0, 0.0);
    vec2 perp = vec2(-dir.y, dir.x);

    float twinkle = 0.55 + 0.45 * sin(time * 1.3 + iPhase);
    float baseSize = iSize * (0.55 + 0.45 * twinkle);

    float streakLen = baseSize + min(motionLen * streakAmount, maxStreak);
    float streakWidth = baseSize;

    // position is the unit quad: x,y in [-1, 1].
    vec2 quadOffset = dir * position.x * streakLen + perp * position.y * streakWidth;
    vec2 ndcOffset = quadOffset / vec2(aspect, 1.0);

    gl_Position = clipCurr + vec4(ndcOffset * wC, 0.0, 0.0);
    vUv = position.xy;
    vTwinkle = twinkle;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  varying float vTwinkle;
  varying vec2 vUv;

  uniform vec3 color;
  uniform float opacity;

  void main() {
    // Lens-shaped falloff so streaks taper at the ends.
    float lenFade = max(0.0, 1.0 - vUv.x * vUv.x);
    float widthFade = max(0.0, 1.0 - vUv.y * vUv.y);
    float alpha = pow(lenFade * widthFade, 1.4) * vTwinkle * opacity;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

function generateInstances() {
  const positions = new Float32Array(COUNT * 3);
  const sizes = new Float32Array(COUNT);
  const phases = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const r = 30 + Math.random() * 70;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    // Heavy tail: most stars tiny, a few bright.
    const sizeRoll = Math.random();
    sizes[i] = 0.0015 + Math.pow(sizeRoll, 3) * 0.012;
    phases[i] = Math.random() * Math.PI * 2;
  }
  return { positions, sizes, phases };
}

export function Stars() {
  const { activated } = useKonami();
  const meshRef = useRef<THREE.Mesh>(null);
  const startTime = useRef<number | null>(null);
  const prevView = useRef(new THREE.Matrix4());
  const firstFrame = useRef(true);

  const { geometry, material } = useMemo(() => {
    const { positions, sizes, phases } = generateInstances();

    const geo = new THREE.InstancedBufferGeometry();
    const quad = new Float32Array([
      -1, -1, 0,
       1, -1, 0,
       1,  1, 0,
      -1,  1, 0,
    ]);
    geo.setAttribute("position", new THREE.BufferAttribute(quad, 3));
    geo.setIndex(new THREE.BufferAttribute(new Uint16Array([0, 1, 2, 0, 2, 3]), 1));
    geo.setAttribute("iPosition", new THREE.InstancedBufferAttribute(positions, 3));
    geo.setAttribute("iSize", new THREE.InstancedBufferAttribute(sizes, 1));
    geo.setAttribute("iPhase", new THREE.InstancedBufferAttribute(phases, 1));
    geo.instanceCount = COUNT;
    // Skip frustum culling — the base quad bbox is tiny, real instances live elsewhere.
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 200);

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        prevViewMatrix: { value: new THREE.Matrix4() },
        aspect: { value: 1 },
        streakAmount: { value: 4.5 },
        maxStreak: { value: 0.7 },
        time: { value: 0 },
        color: { value: new THREE.Color("#cdd9ff") },
        opacity: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry: geo, material: mat };
  }, []);

  useFrame(({ camera, clock, size }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const mat = mesh.material as THREE.ShaderMaterial;

    const elapsed = clock.getElapsedTime();
    if (startTime.current === null) startTime.current = elapsed;
    const fadeIn = THREE.MathUtils.clamp((elapsed - startTime.current) / FADE_IN_DURATION, 0, 1);

    mat.uniforms.time.value = elapsed;
    mat.uniforms.aspect.value = size.width / size.height;
    mat.uniforms.opacity.value = fadeIn * 0.95;

    // Sample the camera's current view matrix; on first frame seed prev to avoid a huge fake streak.
    const currentView = camera.matrixWorldInverse;
    if (firstFrame.current) {
      prevView.current.copy(currentView);
      firstFrame.current = false;
    }
    mat.uniforms.prevViewMatrix.value.copy(prevView.current);
    prevView.current.copy(currentView);

    if (activated) {
      const hue = (elapsed * 0.3) % 1;
      mat.uniforms.color.value.setHSL(hue, 1, 0.75);
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={-1}
    />
  );
}
