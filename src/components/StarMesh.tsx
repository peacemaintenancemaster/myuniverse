"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import type { Star } from "@/store/universe";
import { useUniverse } from "@/store/universe";
import { asset } from "@/lib/assets";

const STAR_TEXTURES = [
  asset("/textures/lensflare/lensflare0.png"), // 0: 부드러운 헤일로
  asset("/textures/sprites/spark1.png"), // 1: 회절 십자 (날카로운 빛가시)
];

// id 기반 결정적 난수 (별마다 모양을 다르게)
function rand(seed: number): number {
  const x = Math.sin(seed) * 43758.5453;
  return x - Math.floor(x);
}

export default function StarMesh({ star }: { star: Star }) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const selectStar = useUniverse((s) => s.selectStar);

  const [haloTex, sparkTex] = useLoader(THREE.TextureLoader, STAR_TEXTURES);
  const color = useMemo(() => new THREE.Color(star.color), [star.color]);

  // "내 별"은 배경 별보다 확실히 크고 밝은 주인공이어야 한다.
  // 짧은 답이라도 최소 존재감을 보장한다.
  const base = Math.max(star.size, 0.3);

  // 별마다 다른 성격
  const v = useMemo(() => {
    const id = star.id;
    const hot = color.b > color.r; // 푸른(뜨거운) 별일수록 빛가시가 강하다
    return {
      haloScale: 9 + rand(id + 1) * 7,
      haloOpacity: 0.45 + rand(id) * 0.3,
      sparkOpacity: (hot ? 0.65 : 0.4) + rand(id + 2) * 0.3,
      sparkScale: 9 + rand(id + 3) * 9,
      sparkAngle: rand(id + 4) * Math.PI,
      coreSharp: 0.45 + rand(id + 5) * 0.4,
      twPhase: rand(id + 6) * Math.PI * 2,
      twSpeed: 1.2 + rand(id + 7) * 1.8,
    };
  }, [star.id, color]);

  useFrame(() => {
    if (!groupRef.current || !coreRef.current) return;
    // 탄생 시점(createdAt) 기준 — 이번에 만든 별만 자라나고, 예전 별은 바로 만개
    const elapsed = (Date.now() - star.createdAt) / 1000;
    const appear = Math.min(1, elapsed / 2.0);
    const eased = 1 - Math.pow(1 - appear, 4);

    coreRef.current.scale.setScalar(eased * base * v.coreSharp);

    const twinkle = 0.85 + Math.sin(elapsed * v.twSpeed + v.twPhase) * 0.15;
    groupRef.current.scale.setScalar(eased * twinkle);
  });

  const hov = hovered ? 1.5 : 1;

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
        {/* 작은 별도 탭하기 쉽도록 최소 히트 반경 보장 */}
        <sphereGeometry args={[Math.max(star.size * 6, 1.4), 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* 코어 (밝은 중심, 날카롭게) */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>

      {/* 회절 십자 (빛가시) — 별마다 각도·세기 다름 */}
      <sprite
        scale={[base * v.sparkScale * hov, base * v.sparkScale * hov, 1]}
        rotation={[0, 0, v.sparkAngle]}
      >
        <spriteMaterial
          map={sparkTex}
          color={color}
          transparent
          opacity={v.sparkOpacity * (hovered ? 1.4 : 1)}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>

      {/* 부드러운 헤일로 — 항상 발광 (배경 별과 구분되는 주인공) */}
      <sprite scale={[base * v.haloScale * hov, base * v.haloScale * hov, 1]}>
        <spriteMaterial
          map={haloTex}
          color={color}
          transparent
          opacity={v.haloOpacity * (hovered ? 1.6 : 1)}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>

      {/* 외곽 아우라 — 큰 별일수록 더 멀리 번진다 */}
      <sprite scale={[base * v.haloScale * 2.1, base * v.haloScale * 2.1, 1]}>
        <spriteMaterial
          map={haloTex}
          color={color}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
    </group>
  );
}
