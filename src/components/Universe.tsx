"use client";

import { Suspense } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import BackgroundStars from "./BackgroundStars";
import Nebula from "./Nebula";
import StarMesh from "./StarMesh";
import { useUniverse } from "@/store/universe";

function SpaceBackground() {
  const starmap = useLoader(
    THREE.TextureLoader,
    "/textures/starmap/starmap_4k.jpg"
  );
  starmap.mapping = THREE.EquirectangularReflectionMapping;
  starmap.colorSpace = THREE.SRGBColorSpace;

  return <primitive object={starmap} attach="background" />;
}

function Scene() {
  const stars = useUniverse((s) => s.stars);

  return (
    <>
      <SpaceBackground />
      <ambientLight intensity={0.05} />
      <BackgroundStars />
      <Nebula />
      {stars.map((star) => (
        <StarMesh key={star.id} star={star} />
      ))}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={15}
        autoRotate
        autoRotateSpeed={0.1}
        dampingFactor={0.05}
        rotateSpeed={0.5}
      />
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.1}
          luminanceSmoothing={0.95}
          intensity={2.0}
          mipmapBlur
          radius={0.8}
        />
      </EffectComposer>
    </>
  );
}

export default function Universe() {
  return (
    <Canvas
      camera={{ position: [0, 1, 8], fov: 60 }}
      className="!fixed inset-0"
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
