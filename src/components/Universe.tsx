"use client";

import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import StarMesh from "./StarMesh";
import { useUniverse } from "@/store/universe";

// ── 항성 색온도 팔레트 (HR도표 근사) ────────────────────────────
// 대부분 백~황, 소수 청/적. 균일하지 않게 분포시킨다.
function sampleStarColor(): [number, number, number] {
  const roll = Math.random();
  let c: [number, number, number];
  if (roll < 0.5) c = [1.0, 0.97, 0.92]; // 백색
  else if (roll < 0.68) c = [0.78, 0.85, 1.0]; // 청백
  else if (roll < 0.82) c = [1.0, 0.93, 0.78]; // 황백
  else if (roll < 0.93) c = [1.0, 0.82, 0.6]; // 주황
  else if (roll < 0.98) c = [1.0, 0.66, 0.52]; // 적
  else c = [0.6, 0.72, 1.0]; // 청색 (드물고 뜨거움)
  return c;
}

// ── 절차적 배경별: 단일 Points, 별마다 모양이 다름 ──────────────
function StarField() {
  const ref = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, colors, sizes, phases, spikes, sharps, brights } = useMemo(() => {
    const N = 3800;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const sz = new Float32Array(N);
    const ph = new Float32Array(N);
    const sp = new Float32Array(N);
    const sh = new Float32Array(N);
    const br = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      const r = 50 + Math.pow(Math.random(), 0.7) * 320;
      const th = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(th);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const c = sampleStarColor();
      col[i * 3] = c[0];
      col[i * 3 + 1] = c[1];
      col[i * 3 + 2] = c[2];

      ph[i] = Math.random();

      const tier = Math.random();
      if (tier < 0.74) {
        // 흐릿한 다수: 작고 날카로운 점, spike 없음
        sz[i] = 0.6 + Math.random() * 1.1;
        sh[i] = 110 + Math.random() * 50; // 날카로움
        br[i] = 0.32 + Math.random() * 0.4;
        sp[i] = 0;
      } else if (tier < 0.93) {
        // 중간
        sz[i] = 1.6 + Math.random() * 1.8;
        sh[i] = 55 + Math.random() * 45;
        br[i] = 0.7 + Math.random() * 0.35;
        sp[i] = Math.random() < 0.3 ? Math.random() * 0.3 : 0;
      } else {
        // 드물고 밝은 별: 부드러운 코어 + 회절 십자
        sz[i] = 3.6 + Math.random() * 6.5;
        sh[i] = 20 + Math.random() * 26;
        br[i] = 1.0 + Math.random() * 0.7;
        sp[i] = 0.45 + Math.random() * 0.55;
      }
    }
    return {
      positions: pos,
      colors: col,
      sizes: sz,
      phases: ph,
      spikes: sp,
      sharps: sh,
      brights: br,
    };
  }, []);

  useFrame((_, delta) => {
    if (matRef.current) matRef.current.uniforms.uTime.value += delta;
    if (ref.current) ref.current.rotation.y += 0.000025;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aSpike" args={[spikes, 1]} />
        <bufferAttribute attach="attributes-aSharp" args={[sharps, 1]} />
        <bufferAttribute attach="attributes-aBright" args={[brights, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={`
          attribute float aSize;
          attribute float aPhase;
          attribute float aSpike;
          attribute float aSharp;
          attribute float aBright;
          uniform float uTime;
          varying vec3 vColor;
          varying float vSpike;
          varying float vSharp;
          varying float vBright;
          varying float vTw;
          void main() {
            vColor = color;
            vSpike = aSpike;
            vSharp = aSharp;
            vBright = aBright;
            float tw = 0.68 + 0.32 * sin(uTime * (0.6 + aPhase * 1.8) + aPhase * 6.2831);
            vTw = tw;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = max(1.0, aSize * (240.0 / -mv.z) * (0.85 + 0.15 * tw));
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          varying float vSpike;
          varying float vSharp;
          varying float vBright;
          varying float vTw;
          void main() {
            vec2 p = gl_PointCoord - 0.5;
            float r = length(p);
            float core = exp(-r * r * vSharp);
            float ax = abs(p.x), ay = abs(p.y);
            float sh = exp(-ay * ay * 700.0) * (1.0 - smoothstep(0.0, 0.5, ax));
            float sv = exp(-ax * ax * 700.0) * (1.0 - smoothstep(0.0, 0.5, ay));
            float spikes = (sh + sv) * vSpike;
            float i = (core + spikes * 0.5) * vBright * vTw;
            if (i < 0.004) discard;
            gl_FragColor = vec4(vColor * i, i);
          }
        `}
      />
    </points>
  );
}

// ── 깊이 그라데이션 배경 (사진 큐브맵 대체) ─────────────────────
function Backdrop() {
  return (
    <mesh>
      <sphereGeometry args={[460, 32, 32]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        vertexShader={`
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec3 vDir;
          void main() {
            float band = exp(-pow(vDir.y * 2.1, 2.0));
            vec3 base = vec3(0.004, 0.006, 0.014);
            vec3 mid = vec3(0.022, 0.020, 0.040);
            vec3 col = mix(base, mid, band);
            col += vec3(0.018, 0.009, 0.013) * band * smoothstep(-0.5, 0.7, vDir.x);
            gl_FragColor = vec4(col, 1.0);
          }
        `}
      />
    </mesh>
  );
}

// ── 성운: 매우 희미하고 넓은 가스, 기록하면 흩어짐 ──────────────
// (소프트 원형은 셰이더의 gl_PointCoord로 그리므로 텍스처가 필요 없다)
function Nebula() {
  const dissolveTargets = useUniverse((s) => s.nebulaDissolveTargets);
  const meshRef = useRef<THREE.Points>(null);

  const { positions, colors, opacities, sizes, origPositions } = useMemo(() => {
    const N = 600;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const opa = new Float32Array(N);
    const sz = new Float32Array(N);
    const orig = new Float32Array(N * 3);

    for (let i = 0; i < N; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3 + Math.pow(Math.random(), 0.6) * 15;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.2;
      const z = r * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      orig[i * 3] = x;
      orig[i * 3 + 1] = y;
      orig[i * 3 + 2] = z;

      const c = Math.random();
      let color: THREE.Color;
      if (c < 0.5) color = new THREE.Color().setHSL(0.65, 0.4, 0.045 + Math.random() * 0.03);
      else if (c < 0.8) color = new THREE.Color().setHSL(0.75, 0.3, 0.045 + Math.random() * 0.03);
      else color = new THREE.Color().setHSL(0.55, 0.35, 0.035 + Math.random() * 0.03);
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;

      sz[i] = 40 + Math.random() * 160;
      opa[i] = 0.02 + Math.random() * 0.06;
    }
    return { positions: pos, colors: col, opacities: opa, sizes: sz, origPositions: orig };
  }, []);

  const dissolvedRef = useRef(new Set<number>());

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
    const opaAttr = geo.getAttribute("aOpacity") as THREE.BufferAttribute;

    for (const target of dissolveTargets) {
      for (let i = 0; i < 600; i++) {
        if (dissolvedRef.current.has(i)) continue;
        const dx = origPositions[i * 3] - target[0];
        const dy = origPositions[i * 3 + 1] - target[1];
        const dz = origPositions[i * 3 + 2] - target[2];
        if (dx * dx + dy * dy + dz * dz < 36) dissolvedRef.current.add(i);
      }
    }

    for (const i of dissolvedRef.current) {
      const cur = opaAttr.getX(i);
      if (cur > 0.001) {
        opaAttr.setX(i, cur * (1 - delta * 1.5));
        const px = posAttr.getX(i);
        const py = posAttr.getY(i);
        const pz = posAttr.getZ(i);
        const len = Math.sqrt(px * px + py * py + pz * pz) || 1;
        posAttr.setX(i, px + (px / len) * delta * 0.5);
        posAttr.setY(i, py + (py / len) * delta * 0.5);
        posAttr.setZ(i, pz + (pz / len) * delta * 0.5);
      }
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
          varying vec3 vColor;
          varying float vOpacity;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            float alpha = smoothstep(0.5, 0.1, d) * vOpacity;
            gl_FragColor = vec4(vColor, alpha);
          }
        `}
      />
    </points>
  );
}

function Scene() {
  const stars = useUniverse((s) => s.stars);

  return (
    <>
      <Backdrop />
      <ambientLight intensity={0.02} />
      <StarField />
      <Nebula />
      {stars.map((star) => (
        <StarMesh key={star.id} star={star} />
      ))}
      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={5}
        maxDistance={30}
        autoRotate
        autoRotateSpeed={0.08}
        dampingFactor={0.05}
        rotateSpeed={0.5}
      />
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.42}
          luminanceSmoothing={0.8}
          intensity={1.1}
          mipmapBlur
          radius={0.6}
        />
      </EffectComposer>
    </>
  );
}

export default function Universe() {
  return (
    <Canvas
      camera={{ position: [0, 2, 14], fov: 60 }}
      className="!absolute inset-0"
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
      }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
