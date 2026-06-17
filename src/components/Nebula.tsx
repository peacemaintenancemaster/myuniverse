"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useUniverse } from "@/store/universe";

const PARTICLE_COUNT = 2000;

export default function Nebula() {
  const meshRef = useRef<THREE.Points>(null);
  const dissolveTargets = useUniverse((s) => s.nebulaDissolveTargets);

  const { positions, colors, opacities, originalPositions } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);
    const opa = new Float32Array(PARTICLE_COUNT);
    const origPos = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2 + Math.random() * 4;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.4;
      const z = r * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      origPos[i * 3] = x;
      origPos[i * 3 + 1] = y;
      origPos[i * 3 + 2] = z;

      const hue = 0.6 + Math.random() * 0.15;
      const color = new THREE.Color().setHSL(hue, 0.6, 0.4 + Math.random() * 0.2);
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;

      opa[i] = 0.3 + Math.random() * 0.5;
    }
    return { positions: pos, colors: col, opacities: opa, originalPositions: origPos };
  }, []);

  const dissolvedRef = useRef(new Set<number>());

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
    const opaAttr = geo.getAttribute("opacity") as THREE.BufferAttribute;

    for (const target of dissolveTargets) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        if (dissolvedRef.current.has(i)) continue;

        const dx = originalPositions[i * 3] - target[0];
        const dy = originalPositions[i * 3 + 1] - target[1];
        const dz = originalPositions[i * 3 + 2] - target[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 2.5) {
          dissolvedRef.current.add(i);
        }
      }
    }

    for (const i of dissolvedRef.current) {
      const currentOpacity = opaAttr.getX(i);
      if (currentOpacity > 0.01) {
        opaAttr.setX(i, currentOpacity * (1 - delta * 1.5));

        const dirX = posAttr.getX(i) - 0;
        const dirY = posAttr.getY(i) - 0;
        const dirZ = posAttr.getZ(i) - 0;
        const len = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 1;
        posAttr.setX(i, posAttr.getX(i) + (dirX / len) * delta * 0.5);
        posAttr.setY(i, posAttr.getY(i) + (dirY / len) * delta * 0.5);
        posAttr.setZ(i, posAttr.getZ(i) + (dirZ / len) * delta * 0.5);
      }
    }

    // gentle float for non-dissolved particles
    const time = performance.now() * 0.0001;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      if (dissolvedRef.current.has(i)) continue;
      posAttr.setY(
        i,
        originalPositions[i * 3 + 1] + Math.sin(time + i * 0.1) * 0.05
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
        <bufferAttribute attach="attributes-opacity" args={[opacities, 1]} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
        vertexShader={`
          attribute float opacity;
          varying vec3 vColor;
          varying float vOpacity;
          void main() {
            vColor = color;
            vOpacity = opacity;
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = 40.0 / -mvPos.z;
            gl_Position = projectionMatrix * mvPos;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          varying float vOpacity;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float alpha = smoothstep(0.5, 0.1, d) * vOpacity;
            gl_FragColor = vec4(vColor, alpha);
          }
        `}
      />
    </points>
  );
}
