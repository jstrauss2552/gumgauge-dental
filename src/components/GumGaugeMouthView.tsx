import React, { useMemo } from "react";
import type { GumGaugeExam, GumGaugeToothReading } from "../types";
import { formatDisplayDate } from "../utils/dateFormat";
import Mouth3DViewer from "./Mouth3DViewer";

/** Tooth layout: upper arch 1-16 (top), lower arch 17-32 (bottom). Universal numbering. */
const UPPER_TEETH = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const LOWER_TEETH = [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];

function healthToColor(health: string | undefined): string {
  if (health === "Healthy") return "#22c55e";
  if (health === "Moderate") return "#eab308";
  if (health === "Unhealthy") return "#dc2626";
  return "#94a3b8";
}

interface GumGaugeMouthViewProps {
  exams: GumGaugeExam[];
  selectedExamId: string | null;
  onSelectExamId: (id: string | null) => void;
  selectedTooth: number | null;
  onSelectTooth: (tooth: number | null) => void;
  /** When false, hide the scan date dropdown (e.g. when parent already shows it). */
  showDateDropdown?: boolean;
}

export default function GumGaugeMouthView({
  exams,
  selectedExamId,
  onSelectExamId,
  selectedTooth,
  onSelectTooth,
  showDateDropdown = true,
}: GumGaugeMouthViewProps) {
  const exam = useMemo(() => exams.find((e) => e.id === selectedExamId) ?? exams[exams.length - 1] ?? null, [exams, selectedExamId]);
  const byTooth = useMemo(() => {
    if (!exam) return new Map<number, GumGaugeToothReading>();
    return new Map(exam.teeth.map((t) => [t.tooth, t]));
  }, [exam]);

  const reading = selectedTooth != null ? byTooth.get(selectedTooth) : null;

  if (exams.length === 0) {
    return (
      <div className="rounded-xl border border-sky/40 bg-sky/5 p-4 text-center text-navy/70 text-sm">
        No GumGauge scans yet. Run a scan and add readings to the chart to see results here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showDateDropdown && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-navy">Scan date</label>
          <select
            value={selectedExamId ?? exam?.id ?? ""}
            onChange={(e) => {
              onSelectExamId(e.target.value || null);
              onSelectTooth(null);
            }}
            className="px-3 py-2 border border-sky/60 rounded-lg bg-white text-sm"
          >
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {formatDisplayDate(e.scanDate)}
              </option>
            ))}
          </select>
        </div>
      )}

      <p className="text-xs text-navy/60">
        Click a tooth in either view to select it; the same tooth is highlighted in both. Colors: green = Healthy, amber = Moderate, red = Unhealthy.
      </p>

      <div>
        <h3 className="text-sm font-semibold text-navy mb-2">3D view</h3>
        <Mouth3DViewer
          readings={exam?.teeth ?? []}
          selectedTooth={selectedTooth}
          onSelectTooth={onSelectTooth}
          height={320}
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-navy mb-2">2D map</h3>
        <div className="flex flex-col items-center rounded-xl border border-sky/40 bg-white/80 p-3">
          <svg
          viewBox="0 0 320 140"
          className="w-full max-w-md h-auto"
          style={{ maxHeight: "220px" }}
        >
          {/* Upper arch: teeth 1-16 */}
          <g transform="translate(10, 10)">
            <text x="0" y="-2" className="text-[10px] fill-navy/70">Upper (1-16)</text>
            {UPPER_TEETH.map((num, i) => {
              const r = byTooth.get(num);
              const fill = healthToColor(r?.healthResult);
              const isSelected = selectedTooth === num;
              const x = (i % 8) * 38 + 2;
              const y = Math.floor(i / 8) * 32;
              return (
                <g key={num}>
                  <rect
                    x={x}
                    y={y}
                    width={34}
                    height={26}
                    rx={4}
                    fill={fill}
                    stroke={isSelected ? "#0f172a" : "#64748b"}
                    strokeWidth={isSelected ? 2.5 : 1}
                    opacity={0.9}
                    className="cursor-pointer"
                    onClick={() => onSelectTooth(selectedTooth === num ? null : num)}
                  />
                  <text x={x + 17} y={y + 16} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="600">
                    {num}
                  </text>
                </g>
              );
            })}
          </g>
          {/* Lower arch: teeth 17-32 */}
          <g transform="translate(10, 88)">
            <text x="0" y="-2" className="text-[10px] fill-navy/70">Lower (17-32)</text>
            {LOWER_TEETH.map((num, i) => {
              const r = byTooth.get(num);
              const fill = healthToColor(r?.healthResult);
              const isSelected = selectedTooth === num;
              const x = (i % 8) * 38 + 2;
              const y = Math.floor(i / 8) * 32;
              return (
                <g key={num}>
                  <rect
                    x={x}
                    y={y}
                    width={34}
                    height={26}
                    rx={4}
                    fill={fill}
                    stroke={isSelected ? "#0f172a" : "#64748b"}
                    strokeWidth={isSelected ? 2.5 : 1}
                    opacity={0.9}
                    className="cursor-pointer"
                    onClick={() => onSelectTooth(selectedTooth === num ? null : num)}
                  />
                  <text x={x + 17} y={y + 16} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="600">
                    {num}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
        </div>
      </div>

      {reading != null && selectedTooth != null && (
        <div className="rounded-lg border-2 border-navy/30 bg-white p-3 text-sm">
          <p className="font-medium text-navy">Tooth {selectedTooth}</p>
          <p className="text-navy/80">
            Light penetration: <strong>{reading.lightPenetrationPercent != null ? `${reading.lightPenetrationPercent}%` : "—"}</strong>
          </p>
          <p className="text-navy/80">
            Health: <strong className={reading.healthResult === "Unhealthy" ? "text-red-600" : reading.healthResult === "Moderate" ? "text-amber-700" : ""}>{reading.healthResult ?? "—"}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
