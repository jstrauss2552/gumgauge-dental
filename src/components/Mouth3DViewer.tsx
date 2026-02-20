import React, { useMemo, useState, useRef, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import type { GumGaugeToothReading } from "../types";

/** Path to optional custom dental model in public folder. Name your file dental-model.obj (and dental-model.mtl if you have one). */
const DENTAL_OBJ_URL = "/dental-model.obj";

/** Universal numbering: upper 1–16, lower 17–32. */
const UPPER_ARCH = Array.from({ length: 16 }, (_, i) => i + 1);
const LOWER_ARCH = Array.from({ length: 16 }, (_, i) => i + 17);

/** Reference style: uniform matte white/light gray for teeth and gums. */
const MODEL_COLOR = "#e5e5e5";
/** Very light grey for OBJ teeth (reference style). */
const OBJ_TEETH_COLOR = "#f8f8f8";
/** Slightly warmer grey for OBJ gum tissue so it’s distinguishable from teeth. */
const OBJ_GUM_COLOR = "#ebe5e2";
const BACKGROUND_COLOR = "#333333";

/** Anatomical tooth dimensions: central incisors largest; incisors flat, canines taller, molars squarer (Invisalign reference). */
function getToothSize(num: number): [number, number, number] {
  if (num >= 8 && num <= 9) return [0.1, 0.058, 0.048];
  if (num === 7 || num === 10) return [0.078, 0.065, 0.05];
  if (num === 6 || num === 11) return [0.072, 0.082, 0.058];
  if (num >= 4 && num <= 5) return [0.082, 0.068, 0.065];
  if (num >= 12 && num <= 13) return [0.082, 0.068, 0.065];
  if (num >= 1 && num <= 3) return [0.092, 0.062, 0.078];
  if (num >= 14 && num <= 16) return [0.092, 0.062, 0.078];
  if (num >= 23 && num <= 26) return [0.088, 0.052, 0.044];
  if (num === 22 || num === 27) return [0.07, 0.078, 0.052];
  if (num >= 20 && num <= 21) return [0.08, 0.06, 0.06];
  if (num >= 28 && num <= 29) return [0.08, 0.06, 0.06];
  if (num >= 17 && num <= 19) return [0.09, 0.055, 0.072];
  if (num >= 30 && num <= 32) return [0.09, 0.055, 0.072];
  return [0.082, 0.062, 0.062];
}

function healthToTint(health: string | undefined): string {
  if (health === "Healthy") return "#22c55e";
  if (health === "Moderate") return "#eab308";
  if (health === "Unhealthy") return "#dc2626";
  return "#94a3b8";
}

/** Extracts tooth number from mesh name (e.g. "Tooth_8", "tooth8", "8"). */
function getToothNumberFromName(name: string): number | null {
  const m = name.match(/(?:tooth[_\s-]*)?(\d+)/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 && n <= 32 ? n : null;
}

/** True if mesh name suggests gum/gingiva rather than a tooth. */
function isGumMeshName(name: string): boolean {
  const lower = name.toLowerCase();
  return /gum|gingiva|tissue|arch|palate|base|soft|mucosa/.test(lower) && !/\d+/.test(lower);
}

/** Same arch positions as procedural Mouth – used for OBJ + 32 selectable teeth. */
function useToothArchData() {
  return useMemo(() => {
    const upperData = UPPER_ARCH.map((num, i) => {
      const radiusX = 1.0, radiusZ = 0.86, zOcclusion = 0.018;
      const startAngle = Math.PI * 0.5, endAngle = -Math.PI * 0.5;
      const t = i / (UPPER_ARCH.length - 1 || 1);
      const angle = startAngle + t * (endAngle - startAngle);
      const pos: [number, number, number] = [radiusX * Math.cos(angle), 0.22, radiusZ * Math.sin(angle) + zOcclusion];
      const rotationY = Math.atan2(-Math.cos(angle), -Math.sin(angle));
      return { pos, rotationY };
    });
    const lowerData = LOWER_ARCH.map((num, i) => {
      const radiusX = 0.96, radiusZ = 0.82, zOcclusion = -0.018;
      const startAngle = -Math.PI * 0.5, endAngle = Math.PI * 0.5;
      const t = i / (LOWER_ARCH.length - 1 || 1);
      const angle = startAngle + t * (endAngle - startAngle);
      const pos: [number, number, number] = [radiusX * Math.cos(angle), -0.22, radiusZ * Math.sin(angle) + zOcclusion];
      const rotationY = Math.atan2(-Math.cos(angle), -Math.sin(angle));
      return { pos, rotationY };
    });
    return { upperData, lowerData };
  }, []);
}

/** Display-only OBJ model (no selection logic on the mesh). */
function OBJDentalModel({ onLoadResult }: { onLoadResult: (loaded: boolean) => void }) {
  const [group, setGroup] = useState<THREE.Group | null>(null);
  const reported = useRef(false);

  useEffect(() => {
    const loader = new OBJLoader();
    loader.load(
      DENTAL_OBJ_URL,
      (obj) => {
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const mesh = child as THREE.Mesh;
            const isGum = isGumMeshName(mesh.name);
            const baseColor = isGum ? OBJ_GUM_COLOR : OBJ_TEETH_COLOR;
            mesh.material = new THREE.MeshStandardMaterial({
              color: baseColor,
              roughness: 0.88,
              metalness: 0,
              vertexColors: false,
            });
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (isGum && mesh.geometry) mesh.geometry.computeVertexNormals();
          }
        });
        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        obj.scale.setScalar(2 / maxDim);
        obj.position.sub(center.multiplyScalar(2 / maxDim));
        setGroup(obj);
        if (!reported.current) {
          reported.current = true;
          onLoadResult(true);
        }
      },
      undefined,
      () => {
        if (!reported.current) {
          reported.current = true;
          onLoadResult(false);
        }
      }
    );
  }, [onLoadResult]);

  if (!group) return null;
  return <primitive object={group} />;
}

/** One tooth-sized hit target: invisible until selected, then shows health color. Same behaviour as procedural single-tooth select. */
function ToothHitTarget({
  number,
  position,
  rotationY,
  colorTint,
  selected,
  onClick,
}: {
  number: number;
  position: [number, number, number];
  rotationY: number;
  colorTint: string;
  selected: boolean;
  onClick: () => void;
}) {
  const size = useMemo(() => getToothSize(number), [number]);
  const color = selected ? colorTint : OBJ_TEETH_COLOR;
  const opacity = selected ? 0.85 : 0;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox
        args={size}
        radius={0.014}
        smoothness={4}
        onClick={(e: { stopPropagation?: () => void }) => {
          (e as { stopPropagation: () => void }).stopPropagation();
          onClick();
        }}
        onPointerOver={() => { document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "default"; }}
      >
        <meshStandardMaterial
          color={color}
          roughness={0.9}
          metalness={0}
          transparent
          opacity={opacity}
          depthWrite={!selected}
        />
      </RoundedBox>
    </group>
  );
}

/** Single tooth: anatomical rounded block (Invisalign-style), smooth polished surface, facing arch center. */
function Tooth({
  number,
  position,
  rotationY,
  colorTint,
  selected,
  onClick,
}: {
  number: number;
  position: [number, number, number];
  rotationY: number;
  colorTint: string;
  selected: boolean;
  onClick: () => void;
}) {
  const color = useMemo(() => {
    const base = new THREE.Color(MODEL_COLOR);
    if (selected) base.lerp(new THREE.Color(colorTint), 0.2);
    return base;
  }, [colorTint, selected]);
  const size = useMemo(() => getToothSize(number), [number]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox
        args={size}
        radius={0.014}
        smoothness={4}
        castShadow
        receiveShadow
        onClick={(e: { stopPropagation?: () => void }) => {
          (e as { stopPropagation: () => void }).stopPropagation();
          onClick();
        }}
        onPointerOver={(e: { stopPropagation?: () => void }) => {
          (e as { stopPropagation: () => void }).stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        <meshStandardMaterial
          color={color}
          roughness={0.9}
          metalness={0}
        />
      </RoundedBox>
    </group>
  );
}

/** Prominent grid texture for gums (Invisalign-style: small square/rounded pattern on outer gum surface). */
function useGumGridTexture() {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#e8e8e8";
    ctx.fillRect(0, 0, size, size);
    const step = 6;
    const pad = 1;
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= size; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = 0; y <= size; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 3);
    return tex;
  }, []);
}

/** Gum arch: flat ribbon contouring the arch, same matte grey as teeth, prominent grid on outer surface (reference). */
function GumArch({ upper }: { upper: boolean }) {
  const y = upper ? 0.2 : -0.2;
  const rotX = upper ? 0 : Math.PI;
  const gridMap = useGumGridTexture();
  return (
    <group position={[0, y, -0.006]} rotation={[rotX, 0, 0]} scale={[1.02, 0.5, 1.02]}>
      <mesh receiveShadow>
        <torusGeometry args={[0.9, 0.038, 24, 80, Math.PI]} />
        <meshStandardMaterial
          color={MODEL_COLOR}
          roughness={0.88}
          metalness={0}
          map={gridMap}
        />
      </mesh>
    </group>
  );
}

/** 3D mouth: two arches of teeth + gum bands, soft lighting. */
function Mouth({
  readingsByTooth,
  selectedTooth,
  onSelectTooth,
}: {
  readingsByTooth: Map<number, GumGaugeToothReading>;
  selectedTooth: number | null;
  onSelectTooth: (tooth: number | null) => void;
}) {
  const upperData = useMemo(() => {
    const radiusX = 1.0;
    const radiusZ = 0.86;
    const zOcclusion = 0.018;
    const startAngle = Math.PI * 0.5;
    const endAngle = -Math.PI * 0.5;
    return UPPER_ARCH.map((num, i) => {
      const t = i / (UPPER_ARCH.length - 1 || 1);
      const angle = startAngle + t * (endAngle - startAngle);
      const pos: [number, number, number] = [radiusX * Math.cos(angle), 0.22, radiusZ * Math.sin(angle) + zOcclusion];
      const rotationY = Math.atan2(-Math.cos(angle), -Math.sin(angle));
      return { pos, rotationY };
    });
  }, []);

  const lowerData = useMemo(() => {
    const radiusX = 0.96;
    const radiusZ = 0.82;
    const zOcclusion = -0.018;
    const startAngle = -Math.PI * 0.5;
    const endAngle = Math.PI * 0.5;
    return LOWER_ARCH.map((num, i) => {
      const t = i / (LOWER_ARCH.length - 1 || 1);
      const angle = startAngle + t * (endAngle - startAngle);
      const pos: [number, number, number] = [radiusX * Math.cos(angle), -0.22, radiusZ * Math.sin(angle) + zOcclusion];
      const rotationY = Math.atan2(-Math.cos(angle), -Math.sin(angle));
      return { pos, rotationY };
    });
  }, []);

  return (
    <group rotation={[0, 0, 0]}>
      <GumArch upper />
      <GumArch upper={false} />
      {UPPER_ARCH.map((num, i) => (
        <Tooth
          key={`u-${num}`}
          number={num}
          position={upperData[i].pos}
          rotationY={upperData[i].rotationY}
          colorTint={healthToTint(readingsByTooth.get(num)?.healthResult)}
          selected={selectedTooth === num}
          onClick={() => onSelectTooth(selectedTooth === num ? null : num)}
        />
      ))}
      {LOWER_ARCH.map((num, i) => (
        <Tooth
          key={`l-${num}`}
          number={num}
          position={lowerData[i].pos}
          rotationY={lowerData[i].rotationY}
          colorTint={healthToTint(readingsByTooth.get(num)?.healthResult)}
          selected={selectedTooth === num}
          onClick={() => onSelectTooth(selectedTooth === num ? null : num)}
        />
      ))}
    </group>
  );
}

function Scene({
  readingsByTooth,
  selectedTooth,
  onSelectTooth,
}: {
  readingsByTooth: Map<number, GumGaugeToothReading>;
  selectedTooth: number | null;
  onSelectTooth: (tooth: number | null) => void;
}) {
  const [useCustomModel, setUseCustomModel] = useState<boolean | null>(null);
  const { upperData, lowerData } = useToothArchData();

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[1.5, 4, 3.5]} intensity={0.48} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0003} />
      <directionalLight position={[-1.2, 2.5, 2.5]} intensity={0.28} />
      <pointLight position={[0, -0.5, 2]} intensity={0.1} />
      <OBJDentalModel onLoadResult={setUseCustomModel} />
      {useCustomModel === true ? (
        <group>
          {UPPER_ARCH.map((num, i) => (
            <ToothHitTarget
              key={`u-${num}`}
              number={num}
              position={upperData[i].pos}
              rotationY={upperData[i].rotationY}
              colorTint={healthToTint(readingsByTooth.get(num)?.healthResult)}
              selected={selectedTooth === num}
              onClick={() => onSelectTooth(selectedTooth === num ? null : num)}
            />
          ))}
          {LOWER_ARCH.map((num, i) => (
            <ToothHitTarget
              key={`l-${num}`}
              number={num}
              position={lowerData[i].pos}
              rotationY={lowerData[i].rotationY}
              colorTint={healthToTint(readingsByTooth.get(num)?.healthResult)}
              selected={selectedTooth === num}
              onClick={() => onSelectTooth(selectedTooth === num ? null : num)}
            />
          ))}
        </group>
      ) : (
        <Mouth
          readingsByTooth={readingsByTooth}
          selectedTooth={selectedTooth}
          onSelectTooth={onSelectTooth}
        />
      )}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1}
        maxDistance={4}
      />
    </>
  );
}

export interface Mouth3DViewerProps {
  readings?: GumGaugeToothReading[];
  selectedTooth?: number | null;
  onSelectTooth?: (tooth: number | null) => void;
  height?: number;
}

export default function Mouth3DViewer({
  readings = [],
  selectedTooth = null,
  onSelectTooth = () => {},
  height = 320,
}: Mouth3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canMountCanvas, setCanMountCanvas] = useState(false);
  const readingsByTooth = useMemo(
    () => new Map(readings.map((r) => [r.tooth, r])),
    [readings]
  );

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setCanMountCanvas(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const handleEnterFullscreen = () => {
    if (!containerRef.current) return;
    containerRef.current.requestFullscreen?.().catch(() => {
      // Fallback: some browsers or contexts don't support fullscreen
    });
  };

  const handleExitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl overflow-hidden border border-white/10 bg-[#333333]"
      style={{ height, maxWidth: "100%" }}
    >
      {canMountCanvas ? (
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center text-white/50 text-sm bg-[#333333]">
              Loading 3D…
            </div>
          }
        >
          <Canvas
            camera={{ position: [0, -0.35, 1.85], fov: 48 }}
            shadows
            gl={{ antialias: true, alpha: false }}
            style={{ width: "100%", height: "100%", display: "block", background: BACKGROUND_COLOR }}
          >
            <color attach="background" args={[BACKGROUND_COLOR]} />
            <Scene
              readingsByTooth={readingsByTooth}
              selectedTooth={selectedTooth}
              onSelectTooth={onSelectTooth}
            />
          </Canvas>
        </Suspense>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/50 text-sm bg-[#333333]">
          Loading 3D…
        </div>
      )}
      {/* Fullscreen button: only way to enter fullscreen; shown bottom-right of the 3D scan result */}
      <button
        type="button"
        onClick={handleEnterFullscreen}
        className="absolute bottom-2 right-2 p-2 rounded-lg bg-black/50 text-white/90 hover:bg-black/70 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 z-10"
        title="Expand 3D view to fullscreen"
        aria-label="Expand 3D view to fullscreen"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      </button>
      {/* Exit fullscreen overlay: only visible when user has entered fullscreen via the button */}
      {isFullscreen && (
        <div className="absolute top-2 right-2 z-20">
          <button
            type="button"
            onClick={handleExitFullscreen}
            className="px-3 py-1.5 rounded-lg bg-black/60 text-white text-sm font-medium hover:bg-black/80 transition-colors"
          >
            Exit fullscreen
          </button>
        </div>
      )}
    </div>
  );
}
