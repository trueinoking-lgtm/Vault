'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PARTICLES } from '@/lib/landing/impact-scene-config';
import { useScrollRef, useReducedMotion } from '@/lib/landing/ScrollContext';
import { phaseProgress, SCROLL_PHASE } from '@/lib/landing/motion-config';

/**
 * Generates a soft circular glow texture for particles.
 * Returns a data URL for use as a sprite.
 */
function createGlowTexture(): THREE.DataTexture {
  const size = 64;
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = x / size - 0.5;
      const dy = y / size - 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Soft gaussian-like falloff
      const alpha = Math.max(0, 1 - dist * 2.2);
      // Core is brighter
      const brightness = Math.max(0, 1 - dist * 1.5);
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = Math.round(alpha * 255);
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Instanced particle field representing raw assessment data points.
 * ~2500 glowing particles that organize from scattered → structured.
 * Enhanced with glow sprite textures, larger sizes, and scroll-driven color shifts.
 */
export default function DataParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const scrollRef = useScrollRef();
  const reducedMotion = useReducedMotion();
  const timeRef = useRef(0);
  const glowTexture = useMemo(() => createGlowTexture(), []);

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

    // Cluster centers for organized state
    const clusterCenters: [number, number, number][] = [
      [-2.5, 1.5, 0], [-3.0, 0.0, 0], [-2.5, -1.5, 0],
      [2.5, 1.5, 0], [3.5, 0.5, 0.5], [3.0, -0.5, -0.3],
      [2.0, -1.5, 0.2], [1.0, -2.5, -0.5],
      [0, 0, 0], [0.5, 2.0, 0],
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Scattered cloud with slight torus tendency, wider spread
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.cbrt(Math.random()) * PARTICLES.spread.x * 0.7;
      base[i3] = Math.sin(phi) * Math.cos(theta) * r;
      base[i3 + 1] = Math.sin(phi) * Math.sin(theta) * r * 0.7;
      base[i3 + 2] = Math.cos(phi) * r * 0.5;

      // Organized: cluster around topic/question nodes
      const center = clusterCenters[Math.floor(Math.random() * clusterCenters.length)];
      organized[i3] = center[0] + (Math.random() - 0.5) * 1.5;
      organized[i3 + 1] = center[1] + (Math.random() - 0.5) * 1.5;
      organized[i3 + 2] = center[2] + (Math.random() - 0.5) * 1.0;

      // Color: weighted toward cyan/blue, amber for weak signals
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

      // Larger size range for more visible, less grainy particles
      siz[i] = PARTICLES.sizes.min + Math.random() * (PARTICLES.sizes.max - PARTICLES.sizes.min);
    }

    return { basePositions: base, organizedPositions: organized, colors: col, sizes: siz };
  }, []);

  const currentPositions = useMemo(() => new Float32Array(basePositions), [basePositions]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    timeRef.current += delta;
    const scroll = reducedMotion ? 0 : scrollRef.current;

    // Scroll-driven organization (0.08–0.35)
    const orgFactor = Math.min(Math.max((scroll - 0.08) / 0.27, 0), 1);
    const easedOrg = 1 - Math.pow(1 - orgFactor, 2);

    const posAttr = pointsRef.current.geometry.attributes.position;
    const array = posAttr.array as Float32Array;
    const count = posAttr.count;
    const driftAmp = (1 - easedOrg) * 0.003;

    // Time-based pulse
    const pulse = Math.sin(timeRef.current * 0.5) * 0.3 + 0.7;

    // Late-phase ambient drift (scroll > 0.5: gentle floating)
    const driftPhase = Math.min(Math.max((scroll - 0.5) / 0.3, 0), 1);
    const driftWobble = driftPhase * 0.002;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const targetX = basePositions[i3] + (organizedPositions[i3] - basePositions[i3]) * easedOrg;
      const targetY = basePositions[i3 + 1] + (organizedPositions[i3 + 1] - basePositions[i3 + 1]) * easedOrg;
      const targetZ = basePositions[i3 + 2] + (organizedPositions[i3 + 2] - basePositions[i3 + 2]) * easedOrg;

      const convergence = 0.03 + easedOrg * 0.04;
      // Add late-phase ambient wobble for persistent motion
      const wobbleX = Math.sin(timeRef.current * 0.3 + i * 0.01) * driftWobble;
      const wobbleY = Math.cos(timeRef.current * 0.4 + i * 0.015) * driftWobble;

      array[i3] += (targetX - array[i3]) * convergence + wobbleX;
      array[i3 + 1] += (targetY - array[i3 + 1]) * convergence + wobbleY + (Math.random() - 0.5) * driftAmp;
      array[i3 + 2] += (targetZ - array[i3 + 2]) * convergence + (Math.random() - 0.5) * driftAmp;
    }
    posAttr.needsUpdate = true;

    if (matRef.current) {
      // Opacity brightens, size grows as particles organize
      matRef.current.opacity = PARTICLES.opacity * (0.4 + easedOrg * 0.6 * pulse);
      matRef.current.size = 0.08 + easedOrg * 0.07;
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
        map={glowTexture}
        alphaMap={glowTexture}
        alphaTest={0.001}
      />
    </points>
  );
}
