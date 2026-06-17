"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import type { Star } from "@/store/universe";
import { useUniverse } from "@/store/universe";

// HR도표 기반 색온도 매핑
// 격한 답 → 뜨거운 파란 별, 차분한 답 → 따뜻한 금빛 별
const STAR_TEXTURES = [
  "/textures/lensflare/lensflare0.png",
  "/textures/sprites/spark1.png",
  "/textures/sprites/circle.png",
];

export default function StarMesh({ star }: { star: Star }) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const selectStar = useUniverse((s) => s.selectStar);

  const textures = useLoader(THREE.TextureLoader, STAR_TEXTURES);
  const birthTime = useRef(performance.now());

  const color = useMemo(() => new THREE.Color(star.color), [star.color]);

  // 별마다 다른 텍스처 조합 (4종 혼합에서 랜덤 선택)
  const texIndex = useMemo(() => star.id % textures.length, [star.id, textures.length]);
  const rotationSpeed = useMemo(() => 0.1 + (star.id % 7) * 0.05, [star.id]);

  useFrame(() => {
    if (!groupRef.current || !coreRef.current) return;
    const elapsed = (performance.now() - birthTime.current) / 1000;

    // 탄생 애니메이션: 느리게 나타남
    const appear = Math.min(1, elapsed / 2.0);
    const eased = 1 - Math.pow(1 - appear, 4);

    // 별 코어 크기
    coreRef.current.scale.setScalar(eased * star.size);

    // 반짝임: 별마다 다른 주기
    const twinkle = 0.85 + Math.sin(elapsed * (1.5 + (star.id % 5) * 0.3)) * 0.15;
    groupRef.current.scale.setScalar(eased * twinkle);

    // 느린 회전
    groupRef.current.rotation.z += rotationSpeed * 0.01;
  });

  return (
    <group position={star.position} ref={groupRef}>
      {/* 히트 영역 (투명, 넓게) */}
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
        <sphereGeometry args={[star.size * 5, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* 코어 (밝은 중심) */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>

      {/* 주 글로우 (lensflare0 — 부드러운 빛 번짐) */}
      <sprite scale={[star.size * (hovered ? 10 : 6), star.size * (hovered ? 10 : 6), 1]}>
        <spriteMaterial
          map={textures[0]}
          color={color}
          transparent
          opacity={hovered ? 0.9 : 0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>

      {/* 보조 글로우 (spark/circle — 빛 가시) */}
      <sprite
        scale={[star.size * (hovered ? 14 : 8), star.size * (hovered ? 14 : 8), 1]}
        rotation={[0, 0, star.id * 0.5]}
      >
        <spriteMaterial
          map={textures[texIndex]}
          color={color}
          transparent
          opacity={hovered ? 0.5 : 0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>

      {/* 외곽 미세 광망 */}
      <sprite scale={[star.size * 16, star.size * 16, 1]}>
        <spriteMaterial
          map={textures[0]}
          color={color}
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
    </group>
  );
}
