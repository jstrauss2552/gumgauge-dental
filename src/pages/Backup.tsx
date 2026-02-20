import React, { useState, useRef } from "react";
import { downloadExport, importData } from "../storage/exportImport";

export default function Backup() {
  const [includeAudit, setIncludeAudit] = useState(true);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    downloadExport(includeAudit);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setImportFile(file ?? null);
    setImportError(null);
    setImportSuccess(false);
    setConfirmOverwrite(false);
  };

  const handleImport = () => {
    if (!importFile || !confirmOverwrite) return;
    setImportError(null);
    setImportSuccess(false);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = reader.result as string;
        const data = JSON.parse(raw) as unknown;
        const err = importData(data);
        if (err) {
          setImportError(err);
        } else {
          setImportSuccess(true);
          setImportFile(null);
          setConfirmOverwrite(false);
          window.location.reload();
        }
      } catch (e) {
        setImportError(e instanceof Error ? e.message : "Invalid JSON file.");
      }
    };
    reader.readAsText(importFile);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-navy mb-2">Data backup</h1>
      <p className="text-navy/70 mb-6">
        Export all clinic data as a JSON file for backup, or restore from a previous export. Restore overwrites current data.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-6">
          <h2 className="text-lg font-semibold text-navy mb-3">Export</h2>
          <p className="text-sm text-navy/70 mb-4">
            Download a JSON file containing patients, staff, clinic, appointments, operatories, fee schedule, staff availability, and optionally the audit log.
          </p>
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input type="checkbox" checked={includeAudit} onChange={(e) => setIncludeAudit(e.target.checked)} className="rounded border-sky/60" />
            <span className="text-sm text-navy">Include audit log</span>
          </label>
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy-light"
          >
            Download backup file
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-6">
          <h2 className="text-lg font-semibold text-navy mb-3">Import / restore</h2>
          <p className="text-sm text-navy/70 mb-4">
            Restore from a previously exported JSON file. This will overwrite all current patients, staff, appointments, and other data for this mode (demo or live).
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 border border-sky/60 text-navy rounded-lg font-medium hover:bg-sky/10"
            >
              Choose file
            </button>
            {importFile && (
              <div className="text-sm text-navy/80">
                Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
            {importFile && !confirmOverwrite && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmOverwrite(true)}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700"
                >
                  Confirm overwrite and restore
                </button>
              </div>
            )}
            {importFile && confirmOverwrite && (
              <div className="pt-2 space-y-2">
                <p className="text-sm text-amber-800 font-medium">Overwrite all current data and restore from this file?</p>
                <div className="flex gap-2">
                  <button type="button" onClick={handleImport} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
                    Yes, restore
                  </button>
                  <button type="button" onClick={() => { setConfirmOverwrite(false); setImportFile(null); }} className="px-4 py-2 border border-navy/30 rounded-lg font-medium">
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {importError && <p className="text-sm text-red-600">{importError}</p>}
            {importSuccess && <p className="text-sm text-green-700 font-medium">Restore complete. Reloading…</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
