import React, { useState } from "react";
import type { ClinicalNoteEntry } from "../types";
import { CLINICAL_NOTE_TEMPLATES } from "../constants/clinicalNoteTemplates";
import { formatDisplayDate } from "../utils/dateFormat";

interface ClinicalNotesProps {
  notes: ClinicalNoteEntry[];
  onAdd: (entry: Omit<ClinicalNoteEntry, "id" | "createdAt">) => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
}

export default function ClinicalNotes({ notes, onAdd, onDelete, readOnly }: ClinicalNotesProps) {
  const [adding, setAdding] = useState(false);
  const [templateId, setTemplateId] = useState<string>(CLINICAL_NOTE_TEMPLATES[0].id);
  const [content, setContent] = useState("");
  const [noteDate, setNoteDate] = useState(new Date().toISOString().slice(0, 10));

  const template = CLINICAL_NOTE_TEMPLATES.find((t) => t.id === templateId);

  const handleAdd = () => {
    onAdd({ date: noteDate, templateId: templateId === "custom" ? undefined : templateId, content, author: undefined });
    setAdding(false);
    setContent("");
    setNoteDate(new Date().toISOString().slice(0, 10));
  };

  const applyTemplate = () => {
    if (template?.placeholder) setContent(template.placeholder);
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="px-3 py-1.5 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy-light"
          >
            + Add progress note
          </button>
        </div>
      )}

      {adding && (
        <div className="border-2 border-sky/40 rounded-xl p-4 bg-sky/5 space-y-3">
          <h4 className="font-medium text-navy">New clinical / progress note</h4>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs text-navy/70 mb-1">Date</label>
              <input type="date" value={noteDate} onChange={(e) => setNoteDate(e.target.value)} className="px-3 py-2 border border-sky/60 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-navy/70 mb-1">Template</label>
              <select value={templateId} onChange={(e) => { setTemplateId(e.target.value); setContent(""); }} className="px-3 py-2 border border-sky/60 rounded-lg bg-white text-sm">
                {CLINICAL_NOTE_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            {template?.placeholder && (
              <button type="button" onClick={applyTemplate} className="self-end px-3 py-2 border border-sky/60 rounded-lg text-sm">Load template</button>
            )}
          </div>
          <div>
            <label className="block text-xs text-navy/70 mb-1">Content</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder={template?.placeholder} className="w-full px-3 py-2 border border-sky/60 rounded-lg text-sm resize-y" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleAdd} className="px-4 py-2 bg-navy text-white rounded-lg text-sm font-medium">Save note</button>
            <button type="button" onClick={() => { setAdding(false); setContent(""); }} className="px-4 py-2 border border-navy/30 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}

      <ul className="space-y-3">
        {[...notes].reverse().map((n) => (
          <li key={n.id} className="border border-sky/30 rounded-lg p-3 bg-white">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-medium text-navy">{formatDisplayDate(n.date)}</span>
              {n.templateId && (
                <span className="text-xs text-navy/60">{CLINICAL_NOTE_TEMPLATES.find((t) => t.id === n.templateId)?.name ?? n.templateId}</span>
              )}
              {!readOnly && onDelete && (
                <button type="button" onClick={() => onDelete(n.id)} className="text-xs text-red-600 hover:underline">Delete</button>
              )}
            </div>
            <pre className="text-sm text-navy/90 whitespace-pre-wrap font-sans">{n.content}</pre>
          </li>
        ))}
      </ul>
      {notes.length === 0 && !adding && <p className="text-navy/60 text-sm">No clinical notes yet.</p>}
    </div>
  );
}
