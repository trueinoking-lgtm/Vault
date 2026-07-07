'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { DASHBOARD_PANELS } from '@/lib/landing/impact-scene-config';
import { useScrollRef, useReducedMotion } from '@/lib/landing/ScrollContext';

/**
 * Floating glass dashboard panels in 3D space.
 * Slide in from the distance based on scroll progress.
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
    const enterProgress = Math.min(Math.max((scroll - 0.45) / 0.3, 0), 1);
    const easedEnter = 1 - Math.pow(1 - enterProgress, 2);

    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(timeRef.current * 0.15) * 0.05;
    }

    panelRefs.current.forEach((panel, i) => {
      if (!panel) return;
      const config = DASHBOARD_PANELS[i];
      const staggerDelay = i * 0.08;
      const pp = Math.min(Math.max((easedEnter - staggerDelay) / (1 - staggerDelay), 0), 1);

      panel.position.z = config.position[2] - 3 + pp * 3;
      const scale = 0.5 + pp * 0.5;
      panel.scale.setScalar(scale);

      panel.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh && mesh.material) {
          const mat = mesh.material as THREE.Material;
          if (Array.isArray(mat)) return;
          mat.opacity = Math.min(mat.opacity + (pp - mat.opacity) * 0.05, pp);
        }
      });

      panel.position.y = config.position[1] + Math.sin(timeRef.current * 0.3 + i * 1.2) * 0.08;
    });
  });

  return (
    <group ref={groupRef}>
      {DASHBOARD_PANELS.map((panel, i) => (
        <group
          key={panel.label}
          ref={(el) => { panelRefs.current[i] = el; }}
          position={[panel.position[0], panel.position[1], panel.position[2] - 3]}
          scale={[0.5, 0.5, 0.5]}
        >
          <RoundedBox args={[1.2, 0.6, 0.04]} radius={0.06}>
            <meshBasicMaterial color="#0a1628" transparent opacity={0} side={THREE.DoubleSide} />
          </RoundedBox>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[1.22, 0.62]} />
            <meshBasicMaterial color={panel.color} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <Text position={[0, 0.1, 0.06]} fontSize={0.2} color={panel.color} font="/fonts/Inter-Bold.ttf" anchorX="center" anchorY="middle">
            {panel.value}
          </Text>
          <Text position={[0, -0.15, 0.06]} fontSize={0.07} color="#64748b" font="/fonts/Inter-Regular.ttf" anchorX="center" anchorY="middle">
            {panel.label}
          </Text>
        </group>
      ))}
    </group>
  );
}
