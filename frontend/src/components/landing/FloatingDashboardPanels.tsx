'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { DASHBOARD_PANELS } from '@/lib/landing/impact-scene-config';
import { useScrollRef, useReducedMotion } from '@/lib/landing/ScrollContext';

/**
 * Floating glass dashboard panels in 3D space.
 * Slide in from the distance with staggered entrance.
 * Each panel has a coloured glow bar and subtle float animation.
 * Enhanced with ambient hover-glow and stronger entrance impact.
 */
export default function FloatingDashboardPanels() {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const scrollRef = useScrollRef();
  const reducedMotion = useReducedMotion();
  const panelRefs = useRef<(THREE.Group | null)[]>(DASHBOARD_PANELS.map(() => null));

  useFrame((_, delta) => {
    timeRef.current += delta;
    const scroll = reducedMotion ? 0 : scrollRef.current;
    const enterProgress = Math.min(Math.max((scroll - 0.40) / 0.35, 0), 1);
    const easedEnter = 1 - Math.pow(1 - enterProgress, 3); // Cube ease = stronger slam

    if (groupRef.current) {
      // Gentle upward drift
      groupRef.current.position.y = Math.sin(timeRef.current * 0.12) * 0.06;
    }

    panelRefs.current.forEach((panel, i) => {
      if (!panel) return;
      const config = DASHBOARD_PANELS[i];
      const staggerDelay = i * 0.06;
      const pp = Math.min(Math.max((easedEnter - staggerDelay) / (1 - staggerDelay), 0), 1);

      // Zoom in from distance
      panel.position.z = config.position[2] - 4 + pp * 4;
      const scale = 0.4 + pp * 0.6;
      panel.scale.setScalar(scale);

      // Opacity fade
      panel.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh && mesh.material) {
          const mat = mesh.material as THREE.Material;
          if (Array.isArray(mat)) return;
          mat.opacity = Math.min(mat.opacity + (pp - mat.opacity) * 0.08, pp);
        }
      });

      // Gentle hovering bob
      panel.position.y = config.position[1] + Math.sin(timeRef.current * 0.4 + i * 1.5) * 0.1;
    });
  });

  return (
    <group ref={groupRef}>
      {DASHBOARD_PANELS.map((panel, i) => {
        const panelColor = new THREE.Color(panel.color);
        return (
          <group
            key={panel.label}
            ref={(el) => { panelRefs.current[i] = el; }}
            position={[panel.position[0], panel.position[1], panel.position[2] - 4]}
            scale={[0.4, 0.4, 0.4]}
          >
            {/* Main card background */}
            <RoundedBox args={[1.4, 0.65, 0.04]} radius={0.06}>
              <meshBasicMaterial color="#0a1628" transparent opacity={0} side={THREE.DoubleSide} />
            </RoundedBox>

            {/* Accent glow bar (top edge) */}
            <mesh position={[0, 0.33, 0.02]}>
              <planeGeometry args={[1.2, 0.03]} />
              <meshBasicMaterial color={panel.color} transparent opacity={0.7} depthWrite={false} />
            </mesh>

            {/* Panel value */}
            <Text position={[0, 0.12, 0.06]} fontSize={0.22} color={panel.color} anchorX="center" anchorY="middle">
              {panel.value}
            </Text>

            {/* Panel label */}
            <Text position={[0, -0.15, 0.06]} fontSize={0.07} color="#64748b" anchorX="center" anchorY="middle">
              {panel.label}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
