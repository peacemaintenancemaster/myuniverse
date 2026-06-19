"use client";

import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import StarMesh from "./StarMesh";
import { useUniverse } from "@/store/universe";

// ── 항성 색온도 팔레트 (HR도표 근사) ────────────────────────────
function sampleStarColor(): [number, number, number] {
  const roll = Math.random();
  let c: [number, number, number];
  if (roll < 0.42) c = [1.0, 0.97, 0.92]; // 백색
  else if (roll < 0.62) c = [0.7, 0.8, 1.0]; // 청백
  else if (roll < 0.78) c = [1.0, 0.92, 0.74]; // 황백
  else if (roll < 0.9) c = [1.0, 0.78, 0.55]; // 주황
  else if (roll < 0.96) c = [1.0, 0.6, 0.46]; // 적
  else c = [0.55, 0.68, 1.0]; // 청색 (드물고 뜨거움)
  return c;
}

// ── 절차적 배경별: 단일 Points, 별마다 모양이 다름 ──────────────
function StarField() {
  const ref = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, colors, sizes, phases, spikes, sharps, brights } = useMemo(() => {
    const N = 2800;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const sz = new Float32Array(N);
    const ph = new Float32Array(N);
    const sp = new Float32Array(N);
    const sh = new Float32Array(N);
    const br = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      // 넓은 구각 분포 → 줌/회전 시 시차(parallax)로 깊이감
      const r = 30 + Math.pow(Math.random(), 0.6) * 360;
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
      if (tier < 0.58) {
        // 흐릿한 다수: 작고 날카로운 점
        sz[i] = 0.7 + Math.random() * 1.3;
        sh[i] = 95 + Math.random() * 55;
        br[i] = 0.5 + Math.random() * 0.5;
        sp[i] = 0;
      } else if (tier < 0.86) {
        // 중간 — 또렷하고 색이 보임
        sz[i] = 1.8 + Math.random() * 2.4;
        sh[i] = 45 + Math.random() * 40;
        br[i] = 1.0 + Math.random() * 0.5;
        sp[i] = Math.random() < 0.35 ? Math.random() * 0.4 : 0;
      } else {
        // 드물고 밝은 별: 부드러운 코어 + 회절 십자
        sz[i] = 4.0 + Math.random() * 8.5;
        sh[i] = 16 + Math.random() * 24;
        br[i] = 1.5 + Math.random() * 1.1;
        sp[i] = 0.5 + Math.random() * 0.55;
      }
    }
    return { positions: pos, colors: col, sizes: sz, phases: ph, spikes: sp, sharps: sh, brights: br };
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
            gl_PointSize = max(1.0, aSize * (300.0 / -mv.z) * (0.85 + 0.15 * tw));
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
            float sh = exp(-ay * ay * 420.0) * (1.0 - smoothstep(0.0, 0.5, ax));
            float sv = exp(-ax * ax * 420.0) * (1.0 - smoothstep(0.0, 0.5, ay));
            float spikes = (sh + sv) * vSpike;
            float i = (core + spikes * 0.9) * vBright * vTw;
            if (i < 0.004) discard;
            gl_FragColor = vec4(vColor * i, i);
          }
        `}
      />
    </points>
  );
}

// ── 깊이 배경: 색을 가진 성운운(은하대) ─────────────────────────
function Backdrop() {
  return (
    <mesh>
      <sphereGeometry args={[480, 32, 32]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        vertexShader={`
          varying vec3 vDir;
          void main() {
            vDir = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec3 vDir;
          float hash(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
          float noise(vec3 x){
            vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
            return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),
                           mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                       mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                           mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
          }
          float fbm(vec3 p){ float a=0.5,s=0.0; for(int k=0;k<5;k++){ s+=a*noise(p); p*=2.03; a*=0.5; } return s; }
          void main(){
            vec3 d = normalize(vDir);
            float band = exp(-pow(d.y * 1.6, 2.0));        // 은하대(수평 띠)
            float n  = fbm(d * 2.6);
            float n2 = fbm(d * 5.5 + 11.0);
            float cloud = smoothstep(0.42, 0.95, n) * band;
            float zone = fbm(d * 1.25 + 4.0);
            vec3 blue   = vec3(0.05, 0.10, 0.24);
            vec3 violet = vec3(0.16, 0.06, 0.22);
            vec3 teal   = vec3(0.03, 0.14, 0.15);
            vec3 neb = mix(blue, violet, smoothstep(0.30, 0.72, zone));
            neb = mix(neb, teal, smoothstep(0.55, 0.92, n2) * 0.6);
            vec3 base = vec3(0.005, 0.007, 0.017);
            vec3 col = base + neb * cloud;
            col += vec3(0.02, 0.018, 0.032) * band * 0.35;  // 옅은 먼지 안개
            gl_FragColor = vec4(col, 1.0);
          }
        `}
      />
    </mesh>
  );
}

// ── 전경 성운: 가까이 떠 있는 컬러 가스, 기록하면 흩어짐 ─────────
function Nebula() {
  const dissolveTargets = useUniverse((s) => s.nebulaDissolveTargets);
  const meshRef = useRef<THREE.Points>(null);

  const { positions, colors, opacities, sizes, origPositions } = useMemo(() => {
    const N = 900;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const opa = new Float32Array(N);
    const sz = new Float32Array(N);
    const orig = new Float32Array(N * 3);

    for (let i = 0; i < N; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3 + Math.pow(Math.random(), 0.55) * 20;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.32;
      const z = r * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      orig[i * 3] = x;
      orig[i * 3 + 1] = y;
      orig[i * 3 + 2] = z;

      // 보라·자홍·청·청록 — 채도와 명도를 살려 컬러 가스로
      const c = Math.random();
      let color: THREE.Color;
      if (c < 0.42) color = new THREE.Color().setHSL(0.72, 0.55, 0.07 + Math.random() * 0.05);
      else if (c < 0.72) color = new THREE.Color().setHSL(0.84, 0.5, 0.07 + Math.random() * 0.05);
      else if (c < 0.9) color = new THREE.Color().setHSL(0.6, 0.55, 0.06 + Math.random() * 0.05);
      else color = new THREE.Color().setHSL(0.5, 0.5, 0.06 + Math.random() * 0.04);
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;

      sz[i] = 50 + Math.random() * 190;
      opa[i] = 0.035 + Math.random() * 0.085;
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
      for (let i = 0; i < 900; i++) {
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
            float alpha = smoothstep(0.5, 0.05, d) * vOpacity;
            gl_FragColor = vec4(vColor, alpha);
          }
        `}
      />
    </points>
  );
}

// 새 별이 생기면 카메라가 그 별로 부드럽게 날아가 화면 중앙에 담는다.
// "방금 내가 별을 만들었다"를 명확히 인지시키는 핵심 동작.
function FocusOnNewStar() {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as
    | (THREE.EventDispatcher & { target: THREE.Vector3; autoRotate: boolean; update: () => void })
    | null;
  const lastId = useRef<number | null>(null);
  const goal = useRef<{ cam: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  useFrame(() => {
    if (!controls) return;
    const stars = useUniverse.getState().stars;
    const last = stars[stars.length - 1];

    if (last && last.id !== lastId.current) {
      lastId.current = last.id;
      // 이번 세션에서 방금 만든 별만 따라간다 (복원된 옛 별은 제외)
      if (Date.now() - last.createdAt < 5000) {
        const sp = new THREE.Vector3(last.position[0], last.position[1], last.position[2]);
        const dir = camera.position.clone().sub(sp).normalize();
        goal.current = { target: sp, cam: sp.clone().add(dir.multiplyScalar(8)) };
        controls.autoRotate = false;
      }
    }

    if (goal.current) {
      camera.position.lerp(goal.current.cam, 0.05);
      controls.target.lerp(goal.current.target, 0.05);
      controls.update();
      if (camera.position.distanceTo(goal.current.cam) < 0.2) {
        goal.current = null;
        controls.autoRotate = true; // 다시 천천히 공전
      }
    }
  });

  return null;
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
      <FocusOnNewStar />
      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        minDistance={2.5}
        maxDistance={75}
        autoRotate
        autoRotateSpeed={0.12}
        dampingFactor={0.06}
        rotateSpeed={0.6}
        panSpeed={0.6}
      />
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.4}
          luminanceSmoothing={0.8}
          intensity={1.2}
          mipmapBlur
          radius={0.62}
        />
      </EffectComposer>
    </>
  );
}

export default function Universe() {
  return (
    <Canvas
      camera={{ position: [0, 2, 17], fov: 65 }}
      className="!absolute inset-0"
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
