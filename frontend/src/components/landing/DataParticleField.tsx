'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PARTICLES } from '@/lib/landing/impact-scene-config';
import { useScrollRef, useReducedMotion } from '@/lib/landing/ScrollContext';

/**
 * Instanced particle field representing raw assessment data points.
 * ~2000 glowing particles that organize from scattered → structured based on scroll.
 */
export default function DataParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const scrollRef = useScrollRef();
  const reducedMotion = useReducedMotion();

  // Generate particle positions, colors, sizes, and target positions
  const { basePositions, organizedPositions, colors, sizes } = useMemo(() => {
    const count = PARTICLES.count;
    const base = new Float32Array(count * 3);
    const organized = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);

    const cyan = new THREE.Color(PARTICLES.colors.cyan);
    const blue = new THREE.Color(PARTICLES.colors.blue);
    const amber = new THREE.Color(PARTICLES.colors.amber);
    const white = new THREE.Color(PARTICLES.colors.white);

    // Cluster centers for organized state
    const clusterCenters: [number, number, number][] = [
      [-2.5, 1.5, 0], [-3.0, 0.0, 0], [-2.5, -1.5, 0],
      [2.5, 1.5, 0], [3.5, 0.5, 0.5], [3.0, -0.5, -0.3],
      [2.0, -1.5, 0.2], [1.0, -2.5, -0.5],
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const theta = Math.random() * Math.PI * 2;
      const r = Math.cbrt(Math.random()) * PARTICLES.spread.x * 0.7;
      base[i3] = Math.cos(theta) * r;
      base[i3 + 1] = (Math.random() - 0.5) * PARTICLES.spread.y;
      base[i3 + 2] = (Math.random() - 0.5) * PARTICLES.spread.z;

      const center = clusterCenters[Math.floor(Math.random() * clusterCenters.length)];
      organized[i3] = center[0] + (Math.random() - 0.5) * 1.2;
      organized[i3 + 1] = center[1] + (Math.random() - 0.5) * 1.2;
      organized[i3 + 2] = center[2] + (Math.random() - 0.5) * 0.8;

      const colorChoice = Math.random();
      let c: THREE.Color;
      if (colorChoice < 0.5) c = cyan;
      else if (colorChoice < 0.85) c = blue;
      else if (colorChoice < 0.95) c = amber;
      else c = white;

      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;
      siz[i] = PARTICLES.sizes.min + Math.random() * (PARTICLES.sizes.max - PARTICLES.sizes.min);
    }

    return { basePositions: base, organizedPositions: organized, colors: col, sizes: siz };
  }, []);

  const currentPositions = useMemo(() => new Float32Array(basePositions), [basePositions]);

  useFrame(() => {
    if (!pointsRef.current) return;
    const scroll = reducedMotion ? 0 : scrollRef.current;

    const orgFactor = Math.min(Math.max((scroll - 0.1) / 0.25, 0), 1);
    const easedOrg = 1 - Math.pow(1 - orgFactor, 2);

    const posAttr = pointsRef.current.geometry.attributes.position;
    const array = posAttr.array as Float32Array;
    const count = posAttr.count;
    const driftAmp = (1 - easedOrg) * 0.002;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const targetX = basePositions[i3] + (organizedPositions[i3] - basePositions[i3]) * easedOrg;
      const targetY = basePositions[i3 + 1] + (organizedPositions[i3 + 1] - basePositions[i3 + 1]) * easedOrg;
      const targetZ = basePositions[i3 + 2] + (organizedPositions[i3 + 2] - basePositions[i3 + 2]) * easedOrg;

      array[i3] += (targetX - array[i3]) * 0.02;
      array[i3 + 1] += (targetY - array[i3 + 1]) * 0.02 + (Math.random() - 0.5) * driftAmp;
      array[i3 + 2] += (targetZ - array[i3 + 2]) * 0.02 + (Math.random() - 0.5) * driftAmp;
    }
    posAttr.needsUpdate = true;

    if (matRef.current) {
      matRef.current.opacity = PARTICLES.opacity * (0.6 + easedOrg * 0.4);
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
        size={0.08}
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
