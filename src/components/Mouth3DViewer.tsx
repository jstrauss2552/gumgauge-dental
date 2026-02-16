import React, { useMemo, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { GumGaugeToothReading } from "../types";

/** Universal numbering: upper 1–16, lower 17–32. */
const UPPER_ARCH = Array.from({ length: 16 }, (_, i) => i + 1);
const LOWER_ARCH = Array.from({ length: 16 }, (_, i) => i + 17);

function healthToHex(health: string | undefined): string {
  if (health === "Healthy") return "#22c55e";
  if (health === "Moderate") return "#eab308";
  if (health === "Unhealthy") return "#dc2626";
  return "#94a3b8";
}

/** Single tooth mesh: rounded box, colored by scan result. */
function Tooth({
  number,
  position,
  color,
  selected,
  onClick,
}: {
  number: number;
  position: [number, number, number];
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <group position={position}>
      <mesh
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        <boxGeometry args={[0.12, 0.08, 0.06]} />
        <meshStandardMaterial
          color={color}
          emissive={selected ? "#1e293b" : "#000000"}
          emissiveIntensity={selected ? 0.15 : 0}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

/** 3D mouth: two arches of 16 teeth each. */
function Mouth({
  readingsByTooth,
  selectedTooth,
  onSelectTooth,
}: {
  readingsByTooth: Map<number, GumGaugeToothReading>;
  selectedTooth: number | null;
  onSelectTooth: (tooth: number | null) => void;
}) {
  const upperPositions = useMemo(() => {
    const radius = 1.0;
    const startAngle = Math.PI * 0.5;
    const endAngle = -Math.PI * 0.5;
    return UPPER_ARCH.map((num, i) => {
      const t = i / (UPPER_ARCH.length - 1 || 1);
      const angle = startAngle + t * (endAngle - startAngle);
      return [radius * Math.cos(angle), 0.35, radius * Math.sin(angle)] as [number, number, number];
    });
  }, []);

  const lowerPositions = useMemo(() => {
    const radius = 0.95;
    const startAngle = -Math.PI * 0.5;
    const endAngle = Math.PI * 0.5;
    return LOWER_ARCH.map((num, i) => {
      const t = i / (LOWER_ARCH.length - 1 || 1);
      const angle = startAngle + t * (endAngle - startAngle);
      return [radius * Math.cos(angle), -0.35, radius * Math.sin(angle)] as [number, number, number];
    });
  }, []);

  return (
    <group rotation={[0, 0, 0]}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 5]} intensity={1} castShadow shadow-mapSize={[512, 512]} />
      <directionalLight position={[-2, 3, 2]} intensity={0.4} />
      {UPPER_ARCH.map((num, i) => (
        <Tooth
          key={`u-${num}`}
          number={num}
          position={upperPositions[i]}
          color={healthToHex(readingsByTooth.get(num)?.healthResult)}
          selected={selectedTooth === num}
          onClick={() => onSelectTooth(selectedTooth === num ? null : num)}
        />
      ))}
      {LOWER_ARCH.map((num, i) => (
        <Tooth
          key={`l-${num}`}
          number={num}
          position={lowerPositions[i]}
          color={healthToHex(readingsByTooth.get(num)?.healthResult)}
          selected={selectedTooth === num}
          onClick={() => onSelectTooth(selectedTooth === num ? null : num)}
        />
      ))}
    </group>
  );
}

export interface Mouth3DViewerProps {
  /** Scan readings per tooth (1–32). Colors teeth by healthResult. */
  readings?: GumGaugeToothReading[];
  selectedTooth?: number | null;
  onSelectTooth?: (tooth: number | null) => void;
  /** Height of the canvas in pixels. */
  height?: number;
}

export default function Mouth3DViewer({
  readings = [],
  selectedTooth = null,
  onSelectTooth = () => {},
  height = 320,
}: Mouth3DViewerProps) {
  const readingsByTooth = useMemo(
    () => new Map(readings.map((r) => [r.tooth, r])),
    [readings]
  );

  return (
    <div className="rounded-xl overflow-hidden border border-sky/40 bg-navy/5" style={{ height }}>
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center text-navy/60 text-sm">
            Loading 3D…
          </div>
        }
      >
        <Canvas
          camera={{ position: [0, 0, 2.2], fov: 45 }}
          shadows
          gl={{ antialias: true, alpha: true }}
        >
          <Mouth
            readingsByTooth={readingsByTooth}
            selectedTooth={selectedTooth}
            onSelectTooth={onSelectTooth}
          />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={1}
            maxDistance={4}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}
