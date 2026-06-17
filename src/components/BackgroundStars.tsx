"use client";

import { useRef, useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 4000;

// 멱법칙 분포: 대부분 작고, 소수만 크다
function powerLawRandom(min: number, max: number, alpha: number = 2.5): number {
  const u = Math.random();
  return min * Math.pow(1 - u, -1 / (alpha - 1));
}

export default function BackgroundStars() {
  const ref = useRef<THREE.Points>(null);

  const sparkTex = useLoader(THREE.TextureLoader, "/textures/sprites/spark1.png");

  const { positions, colors, sizes, phases } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const sz = new Float32Array(COUNT);
    const ph = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      // 구 표면에 균일 분포
      const r = 40 + Math.random() * 60;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      // HR도표 색온도: 대부분 백색~금색, 소수 파란색
      const temp = Math.random();
      let color: THREE.Color;
      if (temp < 0.1) {
        color = new THREE.Color().setHSL(0.6, 0.5, 0.8); // 파란 별 (O/B형)
      } else if (temp < 0.3) {
        color = new THREE.Color().setHSL(0.55, 0.3, 0.9); // 청백 (A형)
      } else if (temp < 0.6) {
        color = new THREE.Color().setHSL(0.15, 0.15, 0.95); // 백색~황백 (F/G형)
      } else if (temp < 0.85) {
        color = new THREE.Color().setHSL(0.1, 0.4, 0.85); // 황색 (K형)
      } else {
        color = new THREE.Color().setHSL(0.05, 0.6, 0.7); // 적색 (M형)
      }
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;

      // 멱법칙 크기 분포: 대부분 미세한 점, 소수만 밝음
      sz[i] = Math.min(powerLawRandom(0.2, 2.5, 3.5), 3.5);

      // 반짝임 위상 (각 별마다 다른 주기)
      ph[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, colors: col, sizes: sz, phases: ph };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTexture: { value: sparkTex },
    }),
    [sparkTex]
  );

  useFrame((_, delta) => {
    if (!ref.current) return;
    uniforms.uTime.value += delta;
    ref.current.rotation.y += 0.00002;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
        uniforms={uniforms}
        vertexShader={`
          attribute float aSize;
          attribute float aPhase;
          varying vec3 vColor;
          varying float vTwinkle;
          uniform float uTime;
          void main() {
            vColor = color;
            // 별마다 다른 속도와 위상으로 반짝임
            float speed = 0.5 + aPhase * 0.8;
            vTwinkle = 0.6 + 0.4 * sin(uTime * speed + aPhase * 6.28);
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (250.0 / -mvPos.z) * vTwinkle;
            gl_Position = projectionMatrix * mvPos;
          }
        `}
        fragmentShader={`
          uniform sampler2D uTexture;
          varying vec3 vColor;
          varying float vTwinkle;
          void main() {
            vec4 texColor = texture2D(uTexture, gl_PointCoord);
            gl_FragColor = vec4(vColor * vTwinkle * 1.5, texColor.a * vTwinkle);
          }
        `}
      />
    </points>
  );
}
