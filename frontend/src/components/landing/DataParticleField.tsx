'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PARTICLES } from '@/lib/landing/impact-scene-config';
import { useScrollRef, useReducedMotion } from '@/lib/landing/ScrollContext';

/**
 * Instanced particle field representing raw assessment data points.
 * ~4000 glowing particles that organize from scattered → structured
 * based on scroll progress. Enhanced with pulsating cluster glow,
 * colour shifts, and a dramatic "ignition" moment on scroll.
 */
export default function DataParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const scrollRef = useScrollRef();
  const reducedMotion = useReducedMotion();
  const timeRef = useRef(0);

  // Generate particle positions, colors, sizes, and target positions
  const { basePositions, organizedPositions, colors, sizes } = useMemo(() => {
    const count = PARTICLES.count;
    const base = new Float32Array(count * 3);
    const organized = new Float32Array(count * 3);
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

    // Cluster centers for organized state — more variety
    const clusterCenters: [number, number, number][] = [
      [-2.5, 1.5, 0], [-3.0, 0.0, 0], [-2.5, -1.5, 0],
      [2.5, 1.5, 0], [3.5, 0.5, 0.5], [3.0, -0.5, -0.3],
      [2.0, -1.5, 0.2], [1.0, -2.5, -0.5],
      [0, 0, 0], [0.5, 2.0, 0],
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Base position: scattered cloud with slight torus tendency
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.cbrt(Math.random()) * PARTICLES.spread.x * 0.6;
      base[i3] = Math.sin(phi) * Math.cos(theta) * r;
      base[i3 + 1] = Math.sin(phi) * Math.sin(theta) * r * 0.7;
      base[i3 + 2] = Math.cos(phi) * r * 0.5;

      // Organized: cluster around topic/question nodes
      const center = clusterCenters[Math.floor(Math.random() * clusterCenters.length)];
      organized[i3] = center[0] + (Math.random() - 0.5) * 1.5;
      organized[i3 + 1] = center[1] + (Math.random() - 0.5) * 1.5;
      organized[i3 + 2] = center[2] + (Math.random() - 0.5) * 1.0;

      // Colour: weighted toward cyan/blue, with amber for weak signals
      const colorChoice = Math.random();
      let c: THREE.Color;
      if (colorChoice < 0.35) c = palette[0];       // cyan
      else if (colorChoice < 0.65) c = palette[1];  // blue
      else if (colorChoice < 0.78) c = palette[2];  // amber
      else if (colorChoice < 0.88) c = palette[4];  // teal
      else if (colorChoice < 0.94) c = palette[5];  // rose
      else c = palette[3];                           // white

      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;
      siz[i] = PARTICLES.sizes.min + Math.random() * (PARTICLES.sizes.max - PARTICLES.sizes.min);
    }

    return { basePositions: base, organizedPositions: organized, colors: col, sizes: siz };
  }, []);

  const currentPositions = useMemo(() => new Float32Array(basePositions), [basePositions]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    timeRef.current += delta;
    const scroll = reducedMotion ? 0 : scrollRef.current;

    // Scroll-driven organization (0.10–0.35)
    const orgFactor = Math.min(Math.max((scroll - 0.08) / 0.27, 0), 1);
    const easedOrg = 1 - Math.pow(1 - orgFactor, 2);

    const posAttr = pointsRef.current.geometry.attributes.position;
    const array = posAttr.array as Float32Array;
    const count = posAttr.count;
    const driftAmp = (1 - easedOrg) * 0.003;

    // Time-based pulse for dramatic effect
    const pulse = Math.sin(timeRef.current * 0.5) * 0.3 + 0.7;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const targetX = basePositions[i3] + (organizedPositions[i3] - basePositions[i3]) * easedOrg;
      const targetY = basePositions[i3 + 1] + (organizedPositions[i3 + 1] - basePositions[i3 + 1]) * easedOrg;
      const targetZ = basePositions[i3 + 2] + (organizedPositions[i3 + 2] - basePositions[i3 + 2]) * easedOrg;

      // Faster convergence = more dramatic transition
      const convergence = 0.03 + easedOrg * 0.04;
      array[i3] += (targetX - array[i3]) * convergence;
      array[i3 + 1] += (targetY - array[i3 + 1]) * convergence + (Math.random() - 0.5) * driftAmp;
      array[i3 + 2] += (targetZ - array[i3 + 2]) * convergence + (Math.random() - 0.5) * driftAmp;
    }
    posAttr.needsUpdate = true;

    if (matRef.current) {
      // Opacity brightens as particles organize
      matRef.current.opacity = PARTICLES.opacity * (0.4 + easedOrg * 0.6 * pulse);
      // Size grows slightly as particles coalesce
      matRef.current.size = 0.06 + easedOrg * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[currentPositions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.06}
        vertexColors
        transparent
        opacity={PARTICLES.opacity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
