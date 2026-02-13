import React, { useState } from "react";
import type { ToothCondition, ToothConditionType } from "../types";

const TOOTH_CONDITION_COLORS: Record<ToothConditionType, string> = {
  Sound: "bg-sky/30 border-sky/50",
  Caries: "bg-red-400 border-red-600",
  "Existing Restoration": "bg-blue-200 border-blue-500",
  Missing: "bg-navy/30 border-navy/50",
  Planned: "bg-amber-300 border-amber-500",
  Implant: "bg-purple-200 border-purple-500",
  Crown: "bg-blue-100 border-blue-400",
  "Root Canal": "bg-green-200 border-green-500",
  Extraction: "bg-navy/20 border-navy/40",
  Other: "bg-sky/20 border-sky/40",
};

const CONDITION_OPTIONS: ToothConditionType[] = [
  "Sound",
  "Caries",
  "Existing Restoration",
  "Missing",
  "Planned",
  "Crown",
  "Root Canal",
  "Implant",
  "Extraction",
  "Other",
];

interface ToothChartProps {
  conditions: ToothCondition[];
  onChange: (conditions: ToothCondition[]) => void;
  readOnly?: boolean;
}

function getConditionForTooth(conditions: ToothCondition[], tooth: number): ToothCondition | undefined {
  return conditions.find((c) => c.tooth === tooth && !c.surface);
}

export default function ToothChart({ conditions, onChange, readOnly }: ToothChartProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [addingSurface, setAddingSurface] = useState(false);

  const updateTooth = (tooth: number, condition: ToothConditionType, status: "Planned" | "Completed" = "Planned") => {
    const existing = conditions.find((c) => c.tooth === tooth && !c.surface);
    const rest = conditions.filter((c) => c.tooth !== tooth || c.surface);
    const now = new Date().toISOString();
    if (existing) {
      onChange([...rest, { ...existing, condition, status, completedAt: status === "Completed" ? now : undefined }]);
    } else {
      onChange([...rest, { id: crypto.randomUUID(), tooth, condition, status, addedAt: now, completedAt: status === "Completed" ? now : undefined }]);
    }
    setSelectedTooth(null);
  };

  const removeToothCondition = (tooth: number) => {
    onChange(conditions.filter((c) => c.tooth !== tooth));
    setSelectedTooth(null);
  };

  const upper = Array.from({ length: 16 }, (_, i) => 1 + i);
  const lower = Array.from({ length: 16 }, (_, i) => 17 + i);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs font-medium text-navy/70">Upper (1–16)</span>
        <div className="flex gap-1 flex-wrap">
          {upper.map((t) => {
            const cond = getConditionForTooth(conditions, t);
            const isSelected = selectedTooth === t;
            return (
              <div key={t} className="relative">
                <button
                  type="button"
                  onClick={() => (readOnly ? null : setSelectedTooth(isSelected ? null : t))}
                  className={`w-8 h-8 rounded border-2 text-xs font-medium flex items-center justify-center transition-colors ${
                    cond ? TOOTH_CONDITION_COLORS[cond.condition] : "bg-white border-sky/40 text-navy/60"
                  } ${isSelected ? "ring-2 ring-navy ring-offset-1" : ""}`}
                  title={cond ? `${t}: ${cond.condition} (${cond.status})` : `Tooth ${t}`}
                >
                  {t}
                </button>
                {isSelected && !readOnly && (
                  <div className="absolute left-0 top-full mt-1 z-10 bg-white border border-sky/40 rounded-lg shadow-lg p-2 min-w-[180px]">
                    <p className="text-xs text-navy/70 mb-1">Tooth {t}</p>
                    <div className="flex flex-wrap gap-1">
                      {CONDITION_OPTIONS.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => updateTooth(t, type)}
                          className={`px-2 py-1 text-xs rounded border ${TOOTH_CONDITION_COLORS[type]}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1 mt-2">
                      <button
                        type="button"
                        onClick={() => updateTooth(t, cond?.condition ?? "Sound", "Completed")}
                        className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
                      >
                        Mark completed
                      </button>
                      {cond && (
                        <button
                          type="button"
                          onClick={() => removeToothCondition(t)}
                          className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-navy/70">Lower (17–32)</span>
        <div className="flex gap-1 flex-wrap">
          {lower.map((t) => {
            const cond = getConditionForTooth(conditions, t);
            const isSelected = selectedTooth === t;
            return (
              <div key={t} className="relative">
                <button
                  type="button"
                  onClick={() => (readOnly ? null : setSelectedTooth(isSelected ? null : t))}
                  className={`w-8 h-8 rounded border-2 text-xs font-medium flex items-center justify-center transition-colors ${
                    cond ? TOOTH_CONDITION_COLORS[cond.condition] : "bg-white border-sky/40 text-navy/60"
                  } ${isSelected ? "ring-2 ring-navy ring-offset-1" : ""}`}
                  title={cond ? `${t}: ${cond.condition} (${cond.status})` : `Tooth ${t}`}
                >
                  {t}
                </button>
                {isSelected && !readOnly && (
                  <div className="absolute left-0 top-full mt-1 z-10 bg-white border border-sky/40 rounded-lg shadow-lg p-2 min-w-[180px]">
                    <p className="text-xs text-navy/70 mb-1">Tooth {t}</p>
                    <div className="flex flex-wrap gap-1">
                      {CONDITION_OPTIONS.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => updateTooth(t, type)}
                          className={`px-2 py-1 text-xs rounded border ${TOOTH_CONDITION_COLORS[type]}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1 mt-2">
                      <button
                        type="button"
                        onClick={() => updateTooth(t, cond?.condition ?? "Sound", "Completed")}
                        className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
                      >
                        Mark completed
                      </button>
                      {cond && (
                        <button
                          type="button"
                          onClick={() => removeToothCondition(t)}
                          className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pt-2 border-t border-sky/20">
        {CONDITION_OPTIONS.map((type) => (
          <span key={type} className={`inline-flex items-center gap-1 text-xs ${TOOTH_CONDITION_COLORS[type]} px-2 py-0.5 rounded`}>
            <span className="w-2 h-2 rounded-full bg-current opacity-70" />
            {type}
          </span>
        ))}
      </div>
    </div>
  );
}
