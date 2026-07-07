'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * MouseParallax — applies subtle camera offset based on cursor position.
 *
 * Creates a gentle parallax depth effect where the 3D scene shifts
 * slightly in response to mouse movement, making it feel alive.
 * Effect is subtle (max ~0.8 units) and respects reduced-motion preference.
 */
export default function MouseParallax({ enabled = true }: { enabled?: boolean }) {
  const { camera } = useThree();
  const targetOffset = useRef(new THREE.Vector2(0, 0));
  const currentOffset = useRef(new THREE.Vector2(0, 0));
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion.current = mq.matches;

    const handleMouse = (e: MouseEvent) => {
      if (!enabled || prefersReducedMotion.current) return;
      // Normalize mouse position to [-1, 1]
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      targetOffset.current.set(nx * 0.6, ny * 0.4);
    };

    window.addEventListener('mousemove', handleMouse, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [enabled]);

  useFrame(() => {
    if (prefersReducedMotion.current) return;
    // Smoothly interpolate toward target
    currentOffset.current.x += (targetOffset.current.x - currentOffset.current.x) * 0.05;
    currentOffset.current.y += (targetOffset.current.y - currentOffset.current.y) * 0.05;

    // Apply as slight camera position offset
    // We offset the camera's target lookAt point, not position directly
    const lookTarget = new THREE.Vector3(
      currentOffset.current.x,
      currentOffset.current.y * 0.5,
      0,
    );
    // Don't directly modify camera — let CameraRig handle it
    // Instead, store offset where CameraRig can read it
    (camera as any).__parallaxOffset = lookTarget;
  });

  return null;
}

/**
 * Reads parallax offset set by MouseParallax and applies it to a given vector.
 */
export function applyParallaxOffset(
  camera: THREE.Camera,
  baseTarget: THREE.Vector3,
  strength: number = 1,
): THREE.Vector3 {
  const offset = (camera as any).__parallaxOffset as THREE.Vector3 | undefined;
  if (!offset) return baseTarget;
  return new THREE.Vector3(
    baseTarget.x + offset.x * strength,
    baseTarget.y + offset.y * strength,
    baseTarget.z,
  );
}
