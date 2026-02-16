import React, { useState } from "react";
import type { PerioExam, PerioToothReadings, GumGaugeExam } from "../types";
import { PERIO_SITES } from "../types";
import { formatDisplayDate } from "../utils/dateFormat";
import GumGaugeMouthView from "./GumGaugeMouthView";
import Mouth3DView from "./Mouth3DView";

const TOOTH_NUMBERS = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // upper then lower

type ViewMode = "numeric" | "graphic";

interface PerioChartProps {
  exams: PerioExam[];
  gumGaugeExams?: GumGaugeExam[];
  onSaveExam: (exam: Omit<PerioExam, "id">) => void;
  onDeleteExam?: (examId: string) => void;
  readOnly?: boolean;
}

export default function PerioChart({ exams, gumGaugeExams = [], onSaveExam, onDeleteExam, readOnly }: PerioChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("numeric");
  const [compareExamIds, setCompareExamIds] = useState<string[]>([]);
  const [addingExam, setAddingExam] = useState(false);
  const [newExamDate, setNewExamDate] = useState(new Date().toISOString().slice(0, 10));
  const [newExamTeeth, setNewExamTeeth] = useState<PerioToothReadings[]>(
    TOOTH_NUMBERS.map((tooth) => ({ tooth, pd: [...Array(6)], bleeding: Array(6).fill(false), suppuration: Array(6).fill(false) }))
  );
  const [newExamNotes, setNewExamNotes] = useState("");

  const updateNewExamTooth = (toothNum: number, field: keyof PerioToothReadings, value: number[] | boolean[] | string) => {
    setNewExamTeeth((prev) =>
      prev.map((t) =>
        t.tooth === toothNum ? { ...t, [field]: value } : t
      )
    );
  };

  const handleSaveNewExam = () => {
    const cleaned = newExamTeeth.map((t) => ({
      ...t,
      pd: t.pd?.map((v) => (v === undefined || v === null ? undefined : Number(v))),
      gm: t.gm?.map((v) => (v === undefined || v === null ? undefined : Number(v))),
      cal: t.cal?.map((v) => (v === undefined || v === null ? undefined : Number(v))),
    }));
    onSaveExam({ examDate: newExamDate, teeth: cleaned, notes: newExamNotes || undefined });
    setAddingExam(false);
    setNewExamDate(new Date().toISOString().slice(0, 10));
    setNewExamTeeth(TOOTH_NUMBERS.map((tooth) => ({ tooth, pd: [...Array(6)], bleeding: Array(6).fill(false), suppuration: Array(6).fill(false) })));
    setNewExamNotes("");
  };

  const selectedExams = exams.filter((e) => compareExamIds.includes(e.id));
  const latestExam = exams.length > 0 ? exams[exams.length - 1] : null;
  const [selectedGumGaugeExamId, setSelectedGumGaugeExamId] = useState<string | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const latestGumGauge = gumGaugeExams.length > 0
    ? (gumGaugeExams.find((e) => e.id === selectedGumGaugeExamId) ?? gumGaugeExams[gumGaugeExams.length - 1])
    : null;
  const gumGaugeByTooth = latestGumGauge
    ? new Map(latestGumGauge.teeth.map((t) => [t.tooth, t]))
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-navy">View:</span>
        <button
          type="button"
          onClick={() => setViewMode("numeric")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${viewMode === "numeric" ? "bg-navy text-white" : "bg-sky/20 text-navy"}`}
        >
          Numeric
        </button>
        <button
          type="button"
          onClick={() => setViewMode("graphic")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${viewMode === "graphic" ? "bg-navy text-white" : "bg-sky/20 text-navy"}`}
        >
          Graphic
        </button>
        {exams.length > 1 && (
          <>
            <span className="text-sm text-navy/70">Compare:</span>
            <select
              multiple
              value={compareExamIds}
              onChange={(e) => setCompareExamIds(Array.from((e.target as HTMLSelectElement).selectedOptions, (o) => o.value))}
              className="border border-sky/60 rounded-lg px-2 py-1 text-sm max-w-[200px]"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {formatDisplayDate(ex.examDate)}
                </option>
              ))}
            </select>
          </>
        )}
        {!readOnly && (
          <button
            type="button"
            onClick={() => setAddingExam(true)}
            className="ml-auto px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            + New exam
          </button>
        )}
      </div>

      {addingExam && (
        <div className="border-2 border-sky/40 rounded-xl p-4 bg-sky/5 space-y-4">
          <h4 className="font-medium text-navy">New periodontal exam</h4>
          <div className="flex gap-4 items-center">
            <label className="text-sm text-navy/70">Exam date</label>
            <input type="date" value={newExamDate} onChange={(e) => setNewExamDate(e.target.value)} className="px-3 py-2 border border-sky/60 rounded-lg" />
          </div>
          <p className="text-xs text-navy/60">PD = Pocket depth (mm), B = Bleeding. Enter values per site (MB, B, DB, ML, L, DL).</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="overflow-x-auto border border-sky/30 rounded-lg p-2 bg-white">
              <h5 className="text-sm font-medium text-navy mb-2">Teeth 1–16</h5>
              <table className="text-xs border border-sky/40 w-full">
                <thead>
                  <tr className="bg-sky/10">
                    <th className="px-2 py-1 border border-sky/30">Tooth</th>
                    {PERIO_SITES.map((s) => (
                      <th key={s} className="px-1 py-1 border border-sky/30">PD {s}</th>
                    ))}
                    {PERIO_SITES.map((s) => (
                      <th key={`b-${s}`} className="px-1 py-1 border border-sky/30">B {s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {newExamTeeth
                    .filter((t) => t.tooth >= 1 && t.tooth <= 16)
                    .sort((a, b) => a.tooth - b.tooth)
                    .map((t) => (
                      <tr key={t.tooth}>
                        <td className="px-2 py-1 border border-sky/30 font-medium">{t.tooth}</td>
                        {PERIO_SITES.map((s, i) => (
                          <td key={s} className="px-1 py-0 border border-sky/30">
                            <input
                              type="number"
                              min={0}
                              max={15}
                              className="w-10 px-0.5 py-0.5 border rounded"
                              value={t.pd?.[i] ?? ""}
                              onChange={(e) => {
                                const v = e.target.value === "" ? undefined : Number(e.target.value);
                                const next = [...(t.pd ?? Array(6).fill(undefined))];
                                next[i] = v;
                                updateNewExamTooth(t.tooth, "pd", next);
                              }}
                            />
                          </td>
                        ))}
                        {PERIO_SITES.map((s, i) => (
                          <td key={`b-${s}`} className="px-1 py-0 border border-sky/30">
                            <input
                              type="checkbox"
                              checked={t.bleeding?.[i] ?? false}
                              onChange={(e) => {
                                const next = [...(t.bleeding ?? Array(6).fill(false))];
                                next[i] = e.target.checked;
                                updateNewExamTooth(t.tooth, "bleeding", next);
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="overflow-x-auto border border-sky/30 rounded-lg p-2 bg-white">
              <h5 className="text-sm font-medium text-navy mb-2">Teeth 17–32</h5>
              <table className="text-xs border border-sky/40 w-full">
                <thead>
                  <tr className="bg-sky/10">
                    <th className="px-2 py-1 border border-sky/30">Tooth</th>
                    {PERIO_SITES.map((s) => (
                      <th key={s} className="px-1 py-1 border border-sky/30">PD {s}</th>
                    ))}
                    {PERIO_SITES.map((s) => (
                      <th key={`b-${s}`} className="px-1 py-1 border border-sky/30">B {s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {newExamTeeth
                    .filter((t) => t.tooth >= 17 && t.tooth <= 32)
                    .sort((a, b) => a.tooth - b.tooth)
                    .map((t) => (
                      <tr key={t.tooth}>
                        <td className="px-2 py-1 border border-sky/30 font-medium">{t.tooth}</td>
                        {PERIO_SITES.map((s, i) => (
                          <td key={s} className="px-1 py-0 border border-sky/30">
                            <input
                              type="number"
                              min={0}
                              max={15}
                              className="w-10 px-0.5 py-0.5 border rounded"
                              value={t.pd?.[i] ?? ""}
                              onChange={(e) => {
                                const v = e.target.value === "" ? undefined : Number(e.target.value);
                                const next = [...(t.pd ?? Array(6).fill(undefined))];
                                next[i] = v;
                                updateNewExamTooth(t.tooth, "pd", next);
                              }}
                            />
                          </td>
                        ))}
                        {PERIO_SITES.map((s, i) => (
                          <td key={`b-${s}`} className="px-1 py-0 border border-sky/30">
                            <input
                              type="checkbox"
                              checked={t.bleeding?.[i] ?? false}
                              onChange={(e) => {
                                const next = [...(t.bleeding ?? Array(6).fill(false))];
                                next[i] = e.target.checked;
                                updateNewExamTooth(t.tooth, "bleeding", next);
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <label className="block text-sm text-navy/70 mb-1">Notes</label>
            <textarea value={newExamNotes} onChange={(e) => setNewExamNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border border-sky/60 rounded-lg text-sm" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleSaveNewExam} className="px-4 py-2 bg-navy text-white rounded-lg text-sm font-medium">Save exam</button>
            <button type="button" onClick={() => setAddingExam(false)} className="px-4 py-2 border border-navy/30 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}

      {viewMode === "numeric" && (selectedExams.length > 0 || latestExam) && (
        <div className="overflow-x-auto">
          {(selectedExams.length > 0 ? selectedExams : latestExam ? [latestExam] : []).map((exam) => (
            <div key={exam.id} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-navy">{formatDisplayDate(exam.examDate)}</span>
                {!readOnly && onDeleteExam && (
                  <button type="button" onClick={() => onDeleteExam(exam.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                )}
              </div>
              <table className="text-xs border border-sky/40 w-full">
                <thead>
                  <tr className="bg-sky/10">
                    <th className="px-2 py-1 border border-sky/30">Tooth</th>
                    {PERIO_SITES.map((s) => (
                      <th key={s} className="px-1 py-1 border border-sky/30" colSpan={2}>{s}</th>
                    ))}
                  </tr>
                  <tr className="bg-sky/5">
                    <th className="px-2 py-1 border border-sky/30"></th>
                    {PERIO_SITES.map((s) => (
                      <React.Fragment key={s}>
                        <th className="px-1 py-1 border border-sky/30">PD</th>
                        <th className="px-1 py-1 border border-sky/30">B</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {exam.teeth.slice(0, 32).map((t) => (
                    <tr key={t.tooth}>
                      <td className="px-2 py-1 border border-sky/30 font-medium">{t.tooth}</td>
                      {PERIO_SITES.map((s, i) => (
                        <React.Fragment key={s}>
                          <td className="px-1 py-1 border border-sky/30">{t.pd?.[i] ?? "—"}</td>
                          <td className="px-1 py-1 border border-sky/30">{t.bleeding?.[i] ? "×" : ""}</td>
                        </React.Fragment>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {exam.notes && <p className="text-xs text-navy/70 mt-1">{exam.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {viewMode === "graphic" && latestExam && (
        <div className="border border-sky/40 rounded-lg p-4 bg-white">
          <p className="text-sm font-medium text-navy mb-2">Graphic view — {formatDisplayDate(latestExam.examDate)}</p>
          <div className="grid grid-cols-8 gap-1 text-center">
            {latestExam.teeth.slice(0, 32).map((t) => (
              <div key={t.tooth} className="border border-sky/30 rounded p-1 bg-sky/5">
                <span className="text-xs font-medium">{t.tooth}</span>
                <div className="flex justify-center gap-0.5 mt-0.5">
                  {(t.pd ?? []).slice(0, 6).map((v, i) => (
                    <span key={i} className={`text-[10px] w-4 ${v !== undefined && v >= 5 ? "text-red-600 font-medium" : "text-navy/70"}`} title={PERIO_SITES[i]}>
                      {v ?? "—"}
                    </span>
                  ))}
                </div>
                {(t.bleeding ?? []).some(Boolean) && <span className="text-red-500 text-[10px]">B</span>}
              </div>
            ))}
          </div>
          <p className="text-xs text-navy/60 mt-2">Pocket depths (mm) by site. Red = 5+ mm. B = bleeding.</p>
        </div>
      )}

      {latestGumGauge && gumGaugeByTooth && (
        <div className="border border-green-200 rounded-xl p-4 bg-green-50/80 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-sm font-semibold text-navy">GumGauge device results (auto-filled from scan)</h4>
            {gumGaugeExams.length > 1 && (
              <>
                <label className="text-xs text-navy/70">Scan date:</label>
                <select
                  value={selectedGumGaugeExamId ?? latestGumGauge.id}
                  onChange={(e) => setSelectedGumGaugeExamId(e.target.value || null)}
                  className="px-2 py-1 border border-sky/60 rounded-lg bg-white text-sm"
                >
                  {gumGaugeExams.map((e) => (
                    <option key={e.id} value={e.id}>{formatDisplayDate(e.scanDate)}</option>
                  ))}
                </select>
              </>
            )}
          </div>
          <p className="text-xs text-navy/70">
            {gumGaugeExams.length === 1 && `Scan date: ${formatDisplayDate(latestGumGauge.scanDate)} — `}
            Light penetration % and health evaluation from device. Use with perio chart above.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="overflow-x-auto border border-sky/30 rounded-lg p-2 bg-white">
              <h5 className="text-xs font-medium text-navy mb-2">Teeth 1–16</h5>
              <table className="text-xs w-full border border-sky/40">
                <thead>
                  <tr className="bg-sky/10">
                    <th className="px-2 py-1 border border-sky/30">Tooth</th>
                    <th className="px-2 py-1 border border-sky/30">Light %</th>
                    <th className="px-2 py-1 border border-sky/30">Health</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((num) => {
                    const r = gumGaugeByTooth.get(num);
                    return (
                      <tr key={num}>
                        <td className="px-2 py-1 border border-sky/30 font-medium">{num}</td>
                        <td className="px-2 py-1 border border-sky/30">{r?.lightPenetrationPercent != null ? `${r.lightPenetrationPercent}%` : "—"}</td>
                        <td className={`px-2 py-1 border border-sky/30 ${r?.healthResult === "Unhealthy" ? "text-red-600 font-medium" : r?.healthResult === "Moderate" ? "text-amber-700" : ""}`}>
                          {r?.healthResult ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="overflow-x-auto border border-sky/30 rounded-lg p-2 bg-white">
              <h5 className="text-xs font-medium text-navy mb-2">Teeth 17–32</h5>
              <table className="text-xs w-full border border-sky/40">
                <thead>
                  <tr className="bg-sky/10">
                    <th className="px-2 py-1 border border-sky/30">Tooth</th>
                    <th className="px-2 py-1 border border-sky/30">Light %</th>
                    <th className="px-2 py-1 border border-sky/30">Health</th>
                  </tr>
                </thead>
                <tbody>
                  {[17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32].map((num) => {
                    const r = gumGaugeByTooth.get(num);
                    return (
                      <tr key={num}>
                        <td className="px-2 py-1 border border-sky/30 font-medium">{num}</td>
                        <td className="px-2 py-1 border border-sky/30">{r?.lightPenetrationPercent != null ? `${r.lightPenetrationPercent}%` : "—"}</td>
                        <td className={`px-2 py-1 border border-sky/30 ${r?.healthResult === "Unhealthy" ? "text-red-600 font-medium" : r?.healthResult === "Moderate" ? "text-amber-700" : ""}`}>
                          {r?.healthResult ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-green-200 space-y-4">
            <p className="text-xs font-medium text-navy mb-2">3D mouth — drag to rotate, scroll to zoom; teeth colored by scan health</p>
            <Mouth3DView
              readings={latestGumGauge.teeth}
              selectedTooth={selectedTooth}
              onSelectTooth={setSelectedTooth}
            />
            <p className="text-xs font-medium text-navy mb-2">Interactive view — click a tooth to see details</p>
            <GumGaugeMouthView
              exams={gumGaugeExams}
              selectedExamId={selectedGumGaugeExamId ?? latestGumGauge?.id ?? null}
              onSelectExamId={setSelectedGumGaugeExamId}
              selectedTooth={selectedTooth}
              onSelectTooth={setSelectedTooth}
              showDateDropdown={false}
            />
          </div>
        </div>
      )}

      {exams.length === 0 && !addingExam && (
        <p className="text-navy/60 text-sm">No periodontal exams yet. Add an exam to record pocket depths, bleeding, and compare over time.</p>
      )}
    </div>
  );
}
