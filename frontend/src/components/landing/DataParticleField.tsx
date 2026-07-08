'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';
import { PARTICLES } from '@/lib/landing/impact-scene-config';
import { useScrollRef, useReducedMotion } from '@/lib/landing/ScrollContext';

/**
 * GPU particle shader.
 * - Honors the per-vertex `aSize` attribute (varying particle sizes) that the
 *   old pointsMaterial silently ignored — this is the core grain fix.
 * - Soft radial falloff computed in the fragment shader (no hard alphaTest
 *   edge), so particles read as glowing dots instead of pixel specks.
 * - Convergence (scatter -> organized) is driven entirely by a `uOrg` uniform,
 *   so the per-frame CPU loop that uploaded 2500 positions is gone.
 */
const ParticleShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uOrg: 0,
    uPixelRatio: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1,
    uOpacity: PARTICLES.opacity,
  },
  // vertex
  /* glsl */ `
    uniform float uTime;
    uniform float uOrg;
    uniform float uPixelRatio;
    attribute float aSize;
    attribute vec3 aBase;
    attribute vec3 aTarget;
    varying vec3 vColor;

    void main() {
      vColor = color;

      // Smoothstep converge from scattered (aBase) to organized (aTarget).
      float o = smoothstep(0.0, 1.0, uOrg);
      vec3 pos = mix(aBase, aTarget, o);

      // Gentle ambient drift so the field never feels frozen mid/late scroll.
      float drift = (1.0 - o) * 0.05 + o * 0.015;
      pos.x += sin(uTime * 0.3 + position.x * 1.7) * drift;
      pos.y += cos(uTime * 0.4 + position.y * 1.9) * drift;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Size attenuation by depth, scaled by the real per-vertex size.
      gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPosition.z);
    }
  `,
  // fragment
  /* glsl */ `
    uniform float uOpacity;
    varying vec3 vColor;

    void main() {
      // gl_PointCoord is [0,1] across the sprite; center it and compute a
      // soft radial falloff -> crisp glowing dot, no hard pixel edge.
      vec2 uv = gl_PointCoord - 0.5;
      float d = length(uv);
      float alpha = smoothstep(0.5, 0.0, d);
      if (alpha <= 0.001) discard;
      gl_FragColor = vec4(vColor, alpha * uOpacity);
    }
  `,
);

extend({ ParticleShaderMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    particleShaderMaterial: any;
  }
}

/**
 * Instanced particle field representing raw assessment data points.
 * ~2500 glowing particles that organize from scattered -> structured as the
 * user scrolls. All motion is GPU-side via uniforms (uOrg/uTime).
 */
export default function DataParticleField() {
  const matRef = useRef<any>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const scrollRef = useScrollRef();
  const reducedMotion = useReducedMotion();
  const timeRef = useRef(0);

  // Static attribute buffers: base (scattered) + target (organized) + size.
  const { basePositions, targetPositions, colors, sizes } = useMemo(() => {
    const count = PARTICLES.count;
    const base = new Float32Array(count * 3);
    const target = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);

    const palette = [
      new THREE.Color(PARTICLES.colors.cyan),
      new THREE.Color(PARTICLES.colors.blue),
      new THREE.Color(PARTICLES.colors.amber),
      new THREE.Color(PARTICLES.colors.white),
      new THREE.Color(PARTICLES.colors.teal),
      new THREE.Color(PARTICLES.colors.rose),
    ];

    const clusterCenters: [number, number, number][] = [
      [-2.5, 1.5, 0], [-3.0, 0.0, 0], [-2.5, -1.5, 0],
      [2.5, 1.5, 0], [3.5, 0.5, 0.5], [3.0, -0.5, -0.3],
      [2.0, -1.5, 0.2], [1.0, -2.5, -0.5],
      [0, 0, 0], [0.5, 2.0, 0],
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Scattered cloud: wide, soft spherical spread.
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.cbrt(Math.random()) * PARTICLES.spread.x * 0.7;
      base[i3] = Math.sin(phi) * Math.cos(theta) * r;
      base[i3 + 1] = Math.sin(phi) * Math.sin(theta) * r * 0.7;
      base[i3 + 2] = Math.cos(phi) * r * 0.5;

      // Organized: cluster around topic/question nodes.
      const center = clusterCenters[Math.floor(Math.random() * clusterCenters.length)];
      target[i3] = center[0] + (Math.random() - 0.5) * 1.5;
      target[i3 + 1] = center[1] + (Math.random() - 0.5) * 1.5;
      target[i3 + 2] = center[2] + (Math.random() - 0.5) * 1.0;

      const colorChoice = Math.random();
      let c: THREE.Color;
      if (colorChoice < 0.35) c = palette[0];
      else if (colorChoice < 0.65) c = palette[1];
      else if (colorChoice < 0.78) c = palette[2];
      else if (colorChoice < 0.88) c = palette[4];
      else if (colorChoice < 0.94) c = palette[5];
      else c = palette[3];

      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;

      // Varied sizes (min..max) -> reads as depth, not uniform grain.
      siz[i] = PARTICLES.sizes.min + Math.random() * (PARTICLES.sizes.max - PARTICLES.sizes.min);
    }

    return { basePositions: base, targetPositions: target, colors: col, sizes: siz };
  }, []);

  useFrame((_, delta) => {
    if (!matRef.current) return;
    timeRef.current += delta;
    const scroll = reducedMotion ? 0 : scrollRef.current;

    // Scroll-driven organization (0.08–0.35), eased.
    const orgFactor = Math.min(Math.max((scroll - 0.08) / 0.27, 0), 1);
    const easedOrg = 1 - Math.pow(1 - orgFactor, 2);

    matRef.current.uTime = timeRef.current;
    matRef.current.uOrg = easedOrg;
    // Brighten slightly as particles organize.
    matRef.current.uOpacity = PARTICLES.opacity * (0.5 + easedOrg * 0.5);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[basePositions, 3]} />
        <bufferAttribute attach="attributes-aBase" args={[basePositions, 3]} />
        <bufferAttribute attach="attributes-aTarget" args={[targetPositions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <particleShaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
      />
    </points>
  );
}
