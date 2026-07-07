'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { QUESTIONS, TOPICS, STREAMS } from '@/lib/landing/impact-scene-config';
import { useScrollRef, useReducedMotion } from '@/lib/landing/ScrollContext';
import { phaseProgress, SCROLL_PHASE } from '@/lib/landing/motion-config';

/**
 * AssessmentNetwork — Question cards + topic nodes + data streams.
 * Enhanced with:
 * - Concentric pulse rings on weak topics
 * - Orbiting micro-particles around each topic
 * - Pulsing stream data flow
 * - Scroll-choreographed entrance
 */
export default function AssessmentNetwork() {
  const streamRef = useRef<THREE.LineSegments>(null);
  const scrollRef = useScrollRef();
  const reducedMotion = useReducedMotion();
  const qRefs = useRef<(THREE.Group | null)[]>(QUESTIONS.map(() => null));
  const tRefs = useRef<(THREE.Group | null)[]>(TOPICS.map(() => null));
  const weakGlowRef = useRef<(THREE.Mesh | null)[]>(TOPICS.map(() => null));
  const pulseRingRef = useRef<(THREE.Mesh | null)[]>(TOPICS.map(() => null));
  const internalTime = useRef(0);
  const orbitAngle = useRef(0);

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
    orbitAngle.current += delta * 0.5;
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
    const tCubic = 1 - Math.pow(1 - weakPulse, 2);

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
          const pulse = tCubic;
          (mat as THREE.MeshStandardMaterial).emissiveIntensity =
            0.15 + pulse * 0.8 + Math.sin(internalTime.current * 3) * 0.15 * pulse;
        }
      });

      // Scale weak glow
      if (weakGlowRef.current[i]) {
        const glow = weakGlowRef.current[i]!;
        const gs = 1 + tCubic * 0.4 * (0.8 + Math.sin(internalTime.current * 2) * 0.2);
        glow.scale.setScalar(gs);
        const gm = glow.material as THREE.MeshBasicMaterial;
        gm.opacity = 0.08 + tCubic * 0.25;
      }

      // Animate pulse ring
      if (pulseRingRef.current[i] && isWeak) {
        const ring = pulseRingRef.current[i]!;
        const ringScale = 0.5 + Math.sin(internalTime.current * 0.8 + i) * 0.3;
        ring.scale.setScalar(1 + tCubic * ringScale * 0.5);
        const rm = ring.material as THREE.MeshBasicMaterial;
        rm.opacity = tCubic * (0.1 + Math.sin(internalTime.current * 0.8 + i) * 0.05);
      }
    });

    // Stream opacity (scroll 0.20–0.40) with pulse
    if (streamRef.current) {
      const streamAlpha = Math.min(Math.max((scroll - 0.20) / 0.2, 0), 1);
      const mat = streamRef.current.material as THREE.LineBasicMaterial;
      // Animated dash-like pulse
      const dataPulse = 0.6 + Math.sin(internalTime.current * 1.5) * 0.4;
      mat.opacity = streamAlpha * (0.3 + Math.sin(internalTime.current * 0.5) * 0.15) * dataPulse;
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
          <Text position={[0, 0, 0.06]} fontSize={0.15} color="#00f0ff" anchorX="center" anchorY="middle">
            {q.label}
          </Text>
        </group>
      ))}

      {/* Topic nodes with orbiting particles */}
      {TOPICS.map((topic, i) => {
        const isWeak = topic.score < 50;
        const nodeColor = isWeak ? '#f59e0b' : '#00f0ff';
        return (
          <group key={topic.id} position={topic.position} ref={(el) => { tRefs.current[i] = el; }}>
            {/* Pulse ring for weak topics */}
            {isWeak && (
              <Sphere args={[0.6, 16, 16]} ref={(el) => { pulseRingRef.current[i] = el; }}>
                <meshBasicMaterial color="#f59e0b" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
              </Sphere>
            )}
            {/* Outer glow */}
            <Sphere args={[0.35, 16, 16]} ref={(el) => { weakGlowRef.current[i] = el; }}>
              <meshBasicMaterial color={nodeColor} transparent opacity={0} depthWrite={false} />
            </Sphere>
            {/* Core sphere */}
            <Sphere args={[0.2, 16, 16]}>
              <meshStandardMaterial color={nodeColor} emissive={nodeColor} emissiveIntensity={0.15} transparent opacity={0} roughness={0.3} metalness={0.1} />
            </Sphere>
            {/* Orbiting micro-particles */}
            <OrbitParticles isWeak={isWeak} nodeColor={nodeColor} />
            {/* Labels */}
            <Text position={[0, -0.45, 0]} fontSize={0.12} color={isWeak ? '#f59e0b' : '#94a3b8'} anchorX="center" anchorY="top">
              {topic.label}
            </Text>
            <Text position={[0, 0.45, 0]} fontSize={0.1} color={nodeColor} anchorX="center" anchorY="bottom">
              {`${topic.score}%`}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

/**
 * OrbitParticles — tiny glowing dots that orbit around topic nodes.
 */
function OrbitParticles({ isWeak, nodeColor }: { isWeak: boolean; nodeColor: string }) {
  const ref = useRef<THREE.Points>(null);
  const count = isWeak ? 6 : 4;
  const radius = 0.4;

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color(nodeColor);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.sin(angle) * radius * 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colors: col };
  }, []);

  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!ref.current) return;
    timeRef.current += delta;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + timeRef.current * 0.6;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.sin(angle) * radius * 0.5;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
