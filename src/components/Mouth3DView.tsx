import React, { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { GumGaugeToothReading, GumGaugeHealthResult } from "../types";

/** Hex colors for health result (scan-based). */
const HEALTH_COLORS: Record<GumGaugeHealthResult | "none", string> = {
  Healthy: "#22c55e",
  Moderate: "#eab308",
  Unhealthy: "#dc2626",
  none: "#94a3b8",
};

/** Universal numbering: position each tooth in two arches. Upper 1-16, lower 17-32. */
function getToothPosition(tooth: number): [number, number, number] {
  const isUpper = tooth <= 16;
  const i = isUpper ? tooth - 1 : tooth - 17;
  const n = 16;
  const t = i / (n - 1);
  const angle = Math.PI * 0.5 - t * Math.PI * 0.85;
  const radius = 2.2;
  const x = Math.cos(angle) * radius * (isUpper ? 1 : 1);
  const z = Math.sin(angle) * radius * (isUpper ? 1 : 1);
  const y = isUpper ? 0.6 : -0.6;
  return [x, y, z];
}

function ToothMeshSimple({
  toothNumber,
  color,
  selected,
  onSelect,
}: {
  toothNumber: number;
  color: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const [hover, setHover] = useState(false);
  const pos = useMemo(() => getToothPosition(toothNumber), [toothNumber]);
  const scale = selected || hover ? 1.15 : 1;
  return (
    <group position={pos} onClick={onSelect} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
      <mesh scale={scale} castShadow receiveShadow>
        <boxGeometry args={[0.22, 0.35, 0.18]} />
        <meshStandardMaterial
          color={color}
          emissive={hover || selected ? color : "#000000"}
          emissiveIntensity={hover || selected ? 0.2 : 0}
          metalness={0.1}
          roughness={0.7}
        />
      </mesh>
    </group>
  );
}

function MouthModelInner({ readings, selectedTooth, onSelectTooth }: { readings: Map<number, GumGaugeToothReading>; selectedTooth: number | null; onSelectTooth: (tooth: number) => void }) {
  const teeth = useMemo(() => Array.from({ length: 32 }, (_, i) => i + 1), []);
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 4]} intensity={1.2} castShadow shadow-mapSize={[512, 512]} />
      <directionalLight position={[-3, 2, -2]} intensity={0.4} />
      {teeth.map((t) => {
        const r = readings.get(t);
        const health: GumGaugeHealthResult | "none" = r?.healthResult ?? "none";
        const color = HEALTH_COLORS[health];
        return (
          <ToothMeshSimple
            key={t}
            toothNumber={t}
            color={color}
            selected={selectedTooth === t}
            onSelect={() => onSelectTooth(t)}
          />
        );
      })}
    </>
  );
}

export interface Mouth3DViewProps {
  /** Scan readings per tooth (1-32). Colors teeth by healthResult. */
  readings?: GumGaugeToothReading[];
  selectedTooth?: number | null;
  onSelectTooth?: (tooth: number) => void;
  className?: string;
}

/**
 * Interactive 3D mouth model driven by device scan data.
 * No external file: 32 teeth are generated in-code and colored by health (green/amber/red).
 */
export default function Mouth3DView({ readings = [], selectedTooth = null, onSelectTooth = () => {}, className = "" }: Mouth3DViewProps) {
  const readingsMap = useMemo(() => {
    const m = new Map<number, GumGaugeToothReading>();
    readings.forEach((r) => m.set(r.tooth, r));
    return m;
  }, [readings]);

  return (
    <div className={className} style={{ width: "100%", aspectRatio: "16/10", minHeight: 280, background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)", borderRadius: 12 }}>
      <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }} shadows>
        <MouthModelInner readings={readingsMap} selectedTooth={selectedTooth} onSelectTooth={onSelectTooth} />
        <OrbitControls enablePan enableZoom enableRotate minDistance={3} maxDistance={12} />
      </Canvas>
    </div>
  );
}
