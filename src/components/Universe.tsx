"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import BackgroundStars from "./BackgroundStars";
import Nebula from "./Nebula";
import StarMesh from "./StarMesh";
import { useUniverse } from "@/store/universe";

function Scene() {
  const stars = useUniverse((s) => s.stars);

  return (
    <>
      <color attach="background" args={["#030308"]} />
      <ambientLight intensity={0.1} />
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
        autoRotateSpeed={0.15}
        dampingFactor={0.05}
      />
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={1.5}
          mipmapBlur
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
      gl={{ antialias: true, alpha: false }}
    >
      <Scene />
    </Canvas>
  );
}
