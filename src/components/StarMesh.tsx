"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Star } from "@/store/universe";
import { useUniverse } from "@/store/universe";

function createGlowTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.2, "rgba(255,255,255,0.6)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0.15)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

let glowTexture: THREE.Texture | null = null;
function getGlowTexture() {
  if (!glowTexture) glowTexture = createGlowTexture();
  return glowTexture;
}

interface StarMeshProps {
  star: Star;
}

export default function StarMesh({ star }: StarMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const [hovered, setHovered] = useState(false);
  const selectStar = useUniverse((s) => s.selectStar);

  const birthTime = useRef(performance.now());
  const color = useMemo(() => new THREE.Color(star.color), [star.color]);
  const texture = useMemo(() => getGlowTexture(), []);

  useFrame(() => {
    if (!meshRef.current) return;
    const elapsed = (performance.now() - birthTime.current) / 1000;

    const scale = Math.min(1, elapsed / 1.5);
    const eased = 1 - Math.pow(1 - scale, 3);
    meshRef.current.scale.setScalar(eased * star.size);

    const twinkle = 0.85 + Math.sin(elapsed * 2 + star.id) * 0.15;
    if (glowRef.current) {
      glowRef.current.scale.setScalar(eased * star.size * (hovered ? 8 : 5) * twinkle);
    }
  });

  return (
    <group position={star.position}>
      {/* Invisible larger hit area for easier clicking */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          selectStar(star);
        }}
        onPointerOver={() => {
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <sphereGeometry args={[star.size * 4, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <sprite ref={glowRef}>
        <spriteMaterial
          map={texture}
          color={color}
          transparent
          opacity={hovered ? 0.7 : 0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
    </group>
  );
}
