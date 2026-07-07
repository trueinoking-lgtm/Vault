'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, AdaptiveDpr, Bvh } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { SCENE } from '@/lib/landing/impact-scene-config';
import { useScrollRef, useReducedMotion } from '@/lib/landing/ScrollContext';
import DataParticleField from './DataParticleField';
import AssessmentNetwork from './AssessmentNetwork';
import FloatingDashboardPanels from './FloatingDashboardPanels';

/**
 * Camera rig — moves based on scroll, static when reduced-motion is preferred.
 */
function CameraRig() {
  const { camera } = useThree();
  const scrollRef = useScrollRef();
  const reducedMotion = useReducedMotion();
  const targetPos = useRef(new THREE.Vector3(0, 0, 8));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    if (reducedMotion) return; // Keep camera at initial position

    const scroll = scrollRef.current;
    const t = Math.min(scroll, 1);
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const camY = e * 2.5;
    const camZ = 8 + e * 5;
    const lookY = e * 1.2;

    targetPos.current.set(0, camY, camZ);
    targetLook.current.set(0, lookY, 0);

    camera.position.lerp(targetPos.current, 0.03);
    camera.lookAt(targetLook.current);
  });

  return null;
}

/**
 * SceneContent — groups all 3D elements inside the Canvas.
 */
function SceneContent() {
  return (
    <>
      <CameraRig />

      <ambientLight intensity={0.4} />
      <pointLight position={[0, 5, 5]} intensity={0.8} color="#00f0ff" />
      <pointLight position={[-3, -2, 3]} intensity={0.3} color="#1e40af" />

      <DataParticleField />
      <AssessmentNetwork />
      <FloatingDashboardPanels />

      <EffectComposer>
        <Bloom
          intensity={0.6}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.3} darkness={0.5} />
      </EffectComposer>

      <Environment preset="night" />
    </>
  );
}

function SceneFallback() {
  return (
    <div className="absolute inset-0 bg-[#050814]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050814] via-[#0a0f2e] to-[#050814]" />
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(ellipse_at_center,_#00f0ff_0%,_transparent_70%)]" />
    </div>
  );
}

/**
 * HeroScene — the main WebGL canvas for the intelligence field.
 */
export default function HeroScene() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Suspense fallback={<SceneFallback />}>
        <Canvas
          dpr={[1, 1.5]}
          camera={{
            position: SCENE.camera.position,
            fov: SCENE.camera.fov,
            near: SCENE.camera.near,
            far: SCENE.camera.far,
          }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
          }}
          style={{ background: SCENE.bgColor }}
        >
          <Bvh>
            <SceneContent />
          </Bvh>
          <AdaptiveDpr pixelated />
        </Canvas>
      </Suspense>
    </div>
  );
}
