"use client";

import { useRef, useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { useUniverse } from "@/store/universe";

const PARTICLE_COUNT = 1200;

export default function Nebula() {
  const meshRef = useRef<THREE.Points>(null);
  const dissolveTargets = useUniverse((s) => s.nebulaDissolveTargets);

  const discTex = useLoader(THREE.TextureLoader, "/textures/sprites/disc.png");

  const { positions, colors, opacities, sizes, originalPositions } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);
    const opa = new Float32Array(PARTICLE_COUNT);
    const sz = new Float32Array(PARTICLE_COUNT);
    const origPos = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2 + Math.pow(Math.random(), 0.7) * 12;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.25;
      const z = r * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      origPos[i * 3] = x;
      origPos[i * 3 + 1] = y;
      origPos[i * 3 + 2] = z;

      const colorChoice = Math.random();
      let color: THREE.Color;
      if (colorChoice < 0.45) {
        color = new THREE.Color().setHSL(0.65 + Math.random() * 0.05, 0.5, 0.08 + Math.random() * 0.07);
      } else if (colorChoice < 0.7) {
        color = new THREE.Color().setHSL(0.75 + Math.random() * 0.06, 0.35, 0.08 + Math.random() * 0.06);
      } else if (colorChoice < 0.85) {
        color = new THREE.Color().setHSL(0.55 + Math.random() * 0.05, 0.4, 0.06 + Math.random() * 0.06);
      } else {
        color = new THREE.Color().setHSL(0.82 + Math.random() * 0.04, 0.25, 0.1 + Math.random() * 0.05);
      }
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;

      const distFromCenter = Math.sqrt(x * x + y * y * 16 + z * z);
      opa[i] = Math.max(0.01, 0.15 - distFromCenter * 0.008) * (0.3 + Math.random() * 0.7);

      const sizeRoll = Math.random();
      if (sizeRoll < 0.12) {
        sz[i] = 80 + Math.random() * 120;
        opa[i] *= 0.12;
      } else if (sizeRoll < 0.4) {
        sz[i] = 30 + Math.random() * 50;
        opa[i] *= 0.2;
      } else {
        sz[i] = 8 + Math.random() * 25;
        opa[i] *= 0.35;
      }
    }
    return { positions: pos, colors: col, opacities: opa, sizes: sz, originalPositions: origPos };
  }, []);

  const dissolvedRef = useRef(new Set<number>());
  const uniformsRef = useRef({ uTime: { value: 0 }, uTexture: { value: discTex } });

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
    const opaAttr = geo.getAttribute("aOpacity") as THREE.BufferAttribute;

    uniformsRef.current.uTime.value += delta;

    // 성운 흩어짐 처리
    for (const target of dissolveTargets) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        if (dissolvedRef.current.has(i)) continue;
        const dx = originalPositions[i * 3] - target[0];
        const dy = originalPositions[i * 3 + 1] - target[1];
        const dz = originalPositions[i * 3 + 2] - target[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 5.0) {
          dissolvedRef.current.add(i);
        }
      }
    }

    for (const i of dissolvedRef.current) {
      const currentOpacity = opaAttr.getX(i);
      if (currentOpacity > 0.005) {
        opaAttr.setX(i, currentOpacity * (1 - delta * 2.0));
        // 바깥으로 흩어지는 동작
        const px = posAttr.getX(i);
        const py = posAttr.getY(i);
        const pz = posAttr.getZ(i);
        const len = Math.sqrt(px * px + py * py + pz * pz) || 1;
        posAttr.setX(i, px + (px / len) * delta * 0.8);
        posAttr.setY(i, py + (py / len) * delta * 0.8);
        posAttr.setZ(i, pz + (pz / len) * delta * 0.8);
      }
    }

    // 비-용해 파티클의 미세 부유 움직임
    const time = uniformsRef.current.uTime.value;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      if (dissolvedRef.current.has(i)) continue;
      posAttr.setY(
        i,
        originalPositions[i * 3 + 1] + Math.sin(time * 0.3 + i * 0.05) * 0.04
      );
    }

    posAttr.needsUpdate = true;
    opaAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aOpacity" args={[opacities, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
        uniforms={uniformsRef.current}
        vertexShader={`
          attribute float aOpacity;
          attribute float aSize;
          varying vec3 vColor;
          varying float vOpacity;
          void main() {
            vColor = color;
            vOpacity = aOpacity;
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize / -mvPos.z;
            gl_Position = projectionMatrix * mvPos;
          }
        `}
        fragmentShader={`
          uniform sampler2D uTexture;
          varying vec3 vColor;
          varying float vOpacity;
          void main() {
            vec4 texColor = texture2D(uTexture, gl_PointCoord);
            float alpha = texColor.a * vOpacity;
            gl_FragColor = vec4(vColor, alpha);
          }
        `}
      />
    </points>
  );
}
