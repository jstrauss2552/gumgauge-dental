import React, { useState } from "react";
import type { FormalTreatmentPlan, TreatmentPlanPhase, TreatmentPlanProcedure } from "../types";
import { formatDisplayDate } from "../utils/dateFormat";
import { CDT_CODES, getDefaultFeeForCode } from "../constants/cdtCodes";
import { TREATMENT_PHASE_NAMES, CLAIM_OR_PROCEDURE_DESCRIPTIONS } from "../constants/autocompleteSuggestions";

interface TreatmentPlanViewProps {
  plans: FormalTreatmentPlan[];
  patientName: string;
  onAddPlan: (plan: Omit<FormalTreatmentPlan, "id">) => void;
  onUpdatePlan: (id: string, updates: Partial<FormalTreatmentPlan>) => void;
  onDeletePlan?: (id: string) => void;
  /** Assign this plan’s procedures to the patient’s billing invoice. */
  onAssignToBilling?: (plan: FormalTreatmentPlan) => void;
  readOnly?: boolean;
}

function formatFee(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function TreatmentPlanView({ plans, patientName, onAddPlan, onUpdatePlan, onDeletePlan, onAssignToBilling, readOnly }: TreatmentPlanViewProps) {
  const [adding, setAdding] = useState(false);
  const [newPhases, setNewPhases] = useState<TreatmentPlanPhase[]>([]);
  const [newStatus, setNewStatus] = useState<FormalTreatmentPlan["status"]>("Draft");
  const [newNotes, setNewNotes] = useState("");

  const addPhase = () => {
    setNewPhases((p) => [...p, { id: crypto.randomUUID(), name: "", procedures: [{ description: "", estimatedFee: undefined }], notes: "" }]);
  };

  const updatePhase = (phaseId: string, updates: Partial<TreatmentPlanPhase>) => {
    setNewPhases((p) => p.map((ph) => (ph.id === phaseId ? { ...ph, ...updates } : ph)));
  };

  const updateProcedure = (phaseId: string, procIndex: number, updates: Partial<TreatmentPlanProcedure>) => {
    setNewPhases((p) =>
      p.map((ph) =>
        ph.id === phaseId
          ? { ...ph, procedures: ph.procedures.map((pr, i) => (i === procIndex ? { ...pr, ...updates } : pr)) }
          : ph
      )
    );
  };

  const addProcedure = (phaseId: string) => {
    setNewPhases((p) => p.map((ph) => (ph.id === phaseId ? { ...ph, procedures: [...ph.procedures, { description: "", estimatedFee: undefined }] } : ph)));
  };

  const removeProcedure = (phaseId: string, procIndex: number) => {
    setNewPhases((p) => p.map((ph) => (ph.id === phaseId ? { ...ph, procedures: ph.procedures.filter((_, i) => i !== procIndex) } : ph)));
  };

  const handleSaveNewPlan = () => {
    if (newPhases.length === 0) return;
    onAddPlan({ createdAt: new Date().toISOString(), phases: newPhases, status: newStatus, notes: newNotes || undefined });
    setAdding(false);
    setNewPhases([]);
    setNewStatus("Draft");
    setNewNotes("");
  };

  const buildPrintHtml = (plan: FormalTreatmentPlan) => {
    const phasesHtml = plan.phases
      .map(
        (ph) =>
          `<div class="phase"><h3>${ph.name}</h3><table><thead><tr><th>Code</th><th>Description</th><th>Est. fee</th></tr></thead><tbody>${ph.procedures
            .map(
              (pr) =>
                `<tr><td>${pr.code ?? "—"}</td><td>${pr.description}</td><td>${pr.estimatedFee != null ? formatFee(pr.estimatedFee) : "—"}</td></tr>`
            )
            .join("")}</tbody></table>${ph.notes ? `<p>${ph.notes}</p>` : ""}</div>`
      )
      .join("");
    const total = plan.phases.flatMap((ph) => ph.procedures).reduce((sum, pr) => sum + (pr.estimatedFee ?? 0), 0);
    return `<h2>Treatment Plan — ${patientName}</h2><p>Created ${formatDisplayDate(plan.createdAt)}</p>${phasesHtml}${plan.notes ? `<p>${plan.notes}</p>` : ""}<p><strong>Total estimated: ${formatFee(total)}</strong></p>`;
  };

  const handlePrint = (plan: FormalTreatmentPlan) => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head><title>Treatment Plan - ${patientName}</title>
      <style>body{font-family:sans-serif;padding:2rem;max-width:800px;margin:0 auto} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ccc;padding:8px;text-align:left} th{background:#f0f0f0} .phase{margin-top:1.5rem} h2{margin-top:0} h3{margin-top:1rem}</style>
      </head><body>${buildPrintHtml(plan)}</body></html>
    `);
    win.document.close();
    win.print();
    win.close();
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setAdding(true)} className="px-3 py-1.5 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy-light">
            + New treatment plan
          </button>
        </div>
      )}

      {adding && (
        <div className="border-2 border-sky/40 rounded-xl p-4 bg-sky/5 space-y-4">
          <h4 className="font-medium text-navy">New treatment plan</h4>
          {newPhases.length === 0 ? (
            <button type="button" onClick={addPhase} className="px-3 py-2 bg-sky/20 text-navy rounded-lg text-sm font-medium">+ Add phase</button>
          ) : (
            newPhases.map((ph) => (
              <div key={ph.id} className="border border-sky/30 rounded-lg p-3 bg-white">
                <input type="text" value={ph.name} onChange={(e) => updatePhase(ph.id, { name: e.target.value })} placeholder="Phase name (e.g. Phase 1: Emergency)" list="treatment-phase-name-list" autoComplete="off" className="w-full px-3 py-2 border border-sky/60 rounded-lg text-sm mb-2" />
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-sky/10">
                      <th className="px-2 py-1 text-left">Code</th>
                      <th className="px-2 py-1 text-left">Description</th>
                      <th className="px-2 py-1 text-right">Est. fee</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ph.procedures.map((pr, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1">
                          <select
                            value={pr.code ?? ""}
                            onChange={(e) => {
                              const code = e.target.value;
                              const entry = CDT_CODES.find((c) => c.code === code);
                              updateProcedure(ph.id, i, {
                                code: code || undefined,
                                description: entry ? entry.description : pr.description,
                                estimatedFee: code ? (getDefaultFeeForCode(code) ?? pr.estimatedFee) : pr.estimatedFee,
                              });
                            }}
                            className="w-28 px-2 py-1 border rounded bg-white text-sm"
                          >
                            <option value="">—</option>
                            {CDT_CODES.map((c) => (
                              <option key={c.code} value={c.code}>{c.code} {c.description}{c.defaultFee != null ? ` — $${c.defaultFee}` : ""}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1"><input type="text" value={pr.description} onChange={(e) => updateProcedure(ph.id, i, { description: e.target.value })} placeholder="Procedure" list="treatment-procedure-desc-list" autoComplete="off" className="w-full px-2 py-1 border rounded" /></td>
                        <td className="px-2 py-1 text-right"><input type="number" min={0} step={0.01} value={pr.estimatedFee ?? ""} onChange={(e) => updateProcedure(ph.id, i, { estimatedFee: e.target.value === "" ? undefined : Number(e.target.value) })} placeholder="0" className="w-24 px-2 py-1 border rounded text-right" /></td>
                        <td><button type="button" onClick={() => removeProcedure(ph.id, i)} className="text-red-600 text-xs">×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" onClick={() => addProcedure(ph.id)} className="mt-1 text-sm text-sky-dark font-medium">+ Add procedure</button>
              </div>
            ))
          )}
          <datalist id="treatment-phase-name-list">
            {TREATMENT_PHASE_NAMES.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
          <datalist id="treatment-procedure-desc-list">
            {CLAIM_OR_PROCEDURE_DESCRIPTIONS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
          {newPhases.length > 0 && (
            <>
              <button type="button" onClick={addPhase} className="px-3 py-2 border border-sky/60 rounded-lg text-sm">+ Add another phase</button>
              <div>
                <label className="block text-xs text-navy/70 mb-1">Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as FormalTreatmentPlan["status"])} className="px-3 py-2 border border-sky/60 rounded-lg text-sm">
                  <option value="Draft">Draft</option>
                  <option value="Accepted">Accepted</option>
                  <option value="In progress">In progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-navy/70 mb-1">Notes</label>
                <textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border border-sky/60 rounded-lg text-sm" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleSaveNewPlan} className="px-4 py-2 bg-navy text-white rounded-lg text-sm font-medium">Save plan</button>
                <button type="button" onClick={() => { setAdding(false); setNewPhases([]); }} className="px-4 py-2 border border-navy/30 rounded-lg text-sm">Cancel</button>
              </div>
            </>
          )}
        </div>
      )}

      {plans.map((plan) => (
        <div key={plan.id} className="border border-sky/40 rounded-xl p-4 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-sm font-medium text-navy">{formatDisplayDate(plan.createdAt)} — {plan.status ?? "Draft"}</span>
            <div className="flex gap-2">
              {!readOnly && (
                <select
                  value={plan.status ?? "Draft"}
                  onChange={(e) => {
                    const v = e.target.value as FormalTreatmentPlan["status"];
                    const now = new Date().toISOString();
                    if (v === "Accepted") onUpdatePlan(plan.id, { status: "Accepted", acceptedAt: now });
                    else if (v === "Declined") onUpdatePlan(plan.id, { status: "Declined", declinedAt: now });
                    else onUpdatePlan(plan.id, { status: v });
                  }}
                  className="px-2 py-1 border border-sky/60 rounded text-sm"
                >
                  <option value="Draft">Draft</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Declined">Declined</option>
                  <option value="In progress">In progress</option>
                  <option value="Completed">Completed</option>
                </select>
              )}
              <button type="button" onClick={() => handlePrint(plan)} className="px-3 py-1.5 border border-sky/60 rounded-lg text-sm font-medium">Print / Email</button>
              {!readOnly && onAssignToBilling && (
                <button type="button" onClick={() => onAssignToBilling(plan)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                  Assign to Billing
                </button>
              )}
              {!readOnly && onDeletePlan && <button type="button" onClick={() => onDeletePlan(plan.id)} className="text-xs text-red-600 hover:underline">Delete</button>}
            </div>
          </div>
          <div className="treatment-plan-print">
            <h2 className="text-lg font-semibold text-navy mb-1">Treatment Plan — {patientName}</h2>
            <p className="text-sm text-navy/70 mb-4">Created {formatDisplayDate(plan.createdAt)}</p>
            {plan.phases.map((ph) => (
              <div key={ph.id} className="phase">
                <h3 className="font-medium text-navy mt-4 mb-2">{ph.name}</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-sky/10">
                      <th className="px-2 py-1 text-left border border-sky/30">Code</th>
                      <th className="px-2 py-1 text-left border border-sky/30">Description</th>
                      <th className="px-2 py-1 text-right border border-sky/30">Est. fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ph.procedures.map((pr, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1 border border-sky/30">{pr.code ?? "—"}</td>
                        <td className="px-2 py-1 border border-sky/30">{pr.description}</td>
                        <td className="px-2 py-1 text-right border border-sky/30">{pr.estimatedFee != null ? formatFee(pr.estimatedFee) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {ph.notes && <p className="text-xs text-navy/70 mt-1">{ph.notes}</p>}
              </div>
            ))}
            {plan.notes && <p className="text-sm text-navy/80 mt-4">{plan.notes}</p>}
            <p className="text-xs text-navy/60 mt-4">Total estimated: {formatFee(plan.phases.flatMap((ph) => ph.procedures).reduce((sum, pr) => sum + (pr.estimatedFee ?? 0), 0))}</p>
          </div>
        </div>
      ))}

      {plans.length === 0 && !adding && <p className="text-navy/60 text-sm">No formal treatment plans yet.</p>}
    </div>
  );
}
