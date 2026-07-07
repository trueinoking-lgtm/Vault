'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { QUESTIONS, TOPICS, STREAMS } from '@/lib/landing/impact-scene-config';
import { useScrollRef, useReducedMotion } from '@/lib/landing/ScrollContext';

/**
 * AssessmentNetwork — Question cards + topic nodes + data streams.
 * Scroll-choreographed: elements fade in and activate based on scroll progress.
 */
export default function AssessmentNetwork() {
  const streamRef = useRef<THREE.LineSegments>(null);
  const scrollRef = useScrollRef();
  const reducedMotion = useReducedMotion();
  const qRefs = useRef<(THREE.Group | null)[]>(QUESTIONS.map(() => null));
  const tRefs = useRef<(THREE.Group | null)[]>(TOPICS.map(() => null));
  const weakGlowRef = useRef<(THREE.Mesh | null)[]>(TOPICS.map(() => null));
  const internalTime = useRef(0);

  // Build stream geometry
  const { streamPositions, streamColors } = useMemo(() => {
    const count = STREAMS.length;
    const positions = new Float32Array(count * 6);
    const colors = new Float32Array(count * 6);

    for (let i = 0; i < count; i++) {
      const qi = STREAMS[i].from;
      const ti = STREAMS[i].to;
      const q = QUESTIONS[qi].position;
      const t = TOPICS[ti].position;

      const i6 = i * 6;
      positions[i6] = q[0];
      positions[i6 + 1] = q[1];
      positions[i6 + 2] = q[2];
      positions[i6 + 3] = t[0];
      positions[i6 + 4] = t[1];
      positions[i6 + 5] = t[2];

      const c1 = new THREE.Color('#00f0ff');
      const c2 = TOPICS[ti].color === '#f59e0b'
        ? new THREE.Color('#f59e0b')
        : new THREE.Color('#1e40af');

      colors[i6] = c1.r;
      colors[i6 + 1] = c1.g;
      colors[i6 + 2] = c1.b;
      colors[i6 + 3] = c2.r;
      colors[i6 + 4] = c2.g;
      colors[i6 + 5] = c2.b;
    }

    return { streamPositions: positions, streamColors: colors };
  }, []);

  useFrame((_, delta) => {
    internalTime.current += delta;
    const scroll = reducedMotion ? 0 : scrollRef.current;

    // Question card opacity (scroll 0.10–0.25)
    const qAlpha = Math.min(Math.max((scroll - 0.10) / 0.15, 0), 1);
    qRefs.current.forEach((group) => {
      if (!group) return;
      group.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        const mat = mesh.material as THREE.Material;
        if (!mat || Array.isArray(mat)) return;
        if ('opacity' in mat) {
          const target = qAlpha > 0.05 ? Math.min(qAlpha * 2, 1) : 0;
          mat.opacity += (target - mat.opacity) * 0.06;
        }
      });
    });

    // Topic opacity (scroll 0.18–0.33) and weak pulse (scroll 0.30–0.55)
    const tAlpha = Math.min(Math.max((scroll - 0.18) / 0.15, 0), 1);
    const weakPulse = Math.min(Math.max((scroll - 0.30) / 0.25, 0), 1);

    tRefs.current.forEach((group, i) => {
      if (!group) return;
      const isWeak = TOPICS[i].score < 50;
      group.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        const mat = mesh.material;
        if (!mat || Array.isArray(mat)) return;

        if ('opacity' in mat) {
          const target = tAlpha > 0.05 ? 1 : 0;
          (mat as THREE.Material).opacity += (target - (mat as THREE.Material).opacity) * 0.06;
        }
        if (isWeak && 'emissiveIntensity' in mat) {
          const pulse = weakPulse;
          (mat as THREE.MeshStandardMaterial).emissiveIntensity =
            0.15 + pulse * 0.6 + Math.sin(internalTime.current * 2) * 0.1 * pulse;
        }
      });

      // Scale weak glow
      if (weakGlowRef.current[i]) {
        const glow = weakGlowRef.current[i]!;
        const gs = 1 + weakPulse * 0.3 * (0.8 + Math.sin(internalTime.current * 2) * 0.2);
        glow.scale.setScalar(gs);
        const gm = glow.material as THREE.MeshBasicMaterial;
        gm.opacity = 0.08 + weakPulse * 0.2;
      }
    });

    // Stream opacity (scroll 0.20–0.40)
    if (streamRef.current) {
      const streamAlpha = Math.min(Math.max((scroll - 0.20) / 0.2, 0), 1);
      const mat = streamRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = streamAlpha * (0.3 + Math.sin(internalTime.current * 0.5) * 0.15);
    }
  });

  return (
    <group>
      {/* Data streams */}
      <lineSegments ref={streamRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[streamPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[streamColors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>

      {/* Question cards */}
      {QUESTIONS.map((q, i) => (
        <group key={q.id} position={q.position} ref={(el) => { qRefs.current[i] = el; }}>
          <RoundedBox args={[0.8, 0.5, 0.05]} radius={0.08}>
            <meshBasicMaterial color="#0a1628" transparent opacity={0} side={THREE.DoubleSide} />
          </RoundedBox>
          <RoundedBox args={[0.78, 0.48, 0.04]} radius={0.06} position={[0, 0, 0.02]}>
            <meshBasicMaterial color="#00f0ff" transparent opacity={0} side={THREE.DoubleSide} />
          </RoundedBox>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[0.82, 0.52]} />
            <meshBasicMaterial color="#00f0ff" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <Text position={[0, 0, 0.06]} fontSize={0.15} color="#00f0ff" font="/fonts/Inter-Bold.ttf" anchorX="center" anchorY="middle">
            {q.label}
          </Text>
        </group>
      ))}

      {/* Topic nodes */}
      {TOPICS.map((topic, i) => {
        const isWeak = topic.score < 50;
        const nodeColor = isWeak ? '#f59e0b' : '#00f0ff';
        return (
          <group key={topic.id} position={topic.position} ref={(el) => { tRefs.current[i] = el; }}>
            <Sphere args={[0.35, 16, 16]} ref={(el) => { weakGlowRef.current[i] = el; }}>
              <meshBasicMaterial color={nodeColor} transparent opacity={0} depthWrite={false} />
            </Sphere>
            <Sphere args={[0.2, 16, 16]}>
              <meshStandardMaterial color={nodeColor} emissive={nodeColor} emissiveIntensity={0.15} transparent opacity={0} roughness={0.3} metalness={0.1} />
            </Sphere>
            <Text position={[0, -0.45, 0]} fontSize={0.12} color={isWeak ? '#f59e0b' : '#94a3b8'} font="/fonts/Inter-Regular.ttf" anchorX="center" anchorY="top">
              {topic.label}
            </Text>
            <Text position={[0, 0.45, 0]} fontSize={0.1} color={nodeColor} font="/fonts/Inter-Bold.ttf" anchorX="center" anchorY="bottom">
              {`${topic.score}%`}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
