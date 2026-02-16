import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getPatients, getPatientById, updatePatient } from "../storage";
import { useAuth } from "../contexts/AuthContext";
import type { PatientImage, GumGaugeExam, GumGaugeToothReading } from "../types";
import { densityToHealthResult, densityToLightPercent } from "../types";
import GumGaugeMouthView from "../components/GumGaugeMouthView";
import Mouth3DView from "../components/Mouth3DView";

const MAX_FILE_SIZE_MB = 3;
/** Scan runs 6–10 seconds: 8 steps × 1s = 8 seconds. Light flashes lower (dimmer) during scan. */
const FLASH_STEP_MS = 1000;
const TOTAL_FLASHES = 8;

/** Build simulated GumGauge readings for all 32 teeth (for demo; real device would send these). */
function buildSimulatedGumGaugeReadings(): GumGaugeToothReading[] {
  const readings: GumGaugeToothReading[] = [];
  for (let tooth = 1; tooth <= 32; tooth++) {
    const density = Math.floor(200 + Math.random() * 400);
    readings.push({
      tooth,
      density,
      lightPenetrationPercent: densityToLightPercent(density),
      healthResult: densityToHealthResult(density),
    });
  }
  return readings;
}

export default function DeviceScan() {
  const location = useLocation();
  const signInReturnTo = location.pathname + location.search;
  const { isSignedIn } = useAuth();
  const patients = getPatients();
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [scanInProgress, setScanInProgress] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [flashStep, setFlashStep] = useState(0);
  const [brightnessPercent, setBrightnessPercent] = useState(50);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedPatient = selectedPatientId ? getPatientById(selectedPatientId) : null;
  const gumGaugeExams = selectedPatient?.gumGaugeExams ?? [];
  const currentImages = selectedPatient?.patientImages ?? [];
  const canAddImage = currentImages.length < 10;

  const handleConnect = () => {
    setDeviceConnected(true);
    setUploadError("");
  };

  const handleStartScan = () => {
    if (!isSignedIn) {
      setUploadError("Sign in to run a scan.");
      return;
    }
    if (!selectedPatientId) {
      setUploadError("Select a patient first.");
      return;
    }
    if (!deviceConnected) {
      setUploadError("Connect the GumGauge device first.");
      return;
    }
    setUploadError("");
    setScanInProgress(true);
    setScanComplete(false);
    setFlashStep(0);
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    scanIntervalRef.current = setInterval(() => {
      setFlashStep((s) => {
        if (s >= TOTAL_FLASHES - 1) {
          if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
          scanIntervalRef.current = null;
          setScanInProgress(false);
          setScanComplete(true);
          return TOTAL_FLASHES;
        }
        return s + 1;
      });
    }, FLASH_STEP_MS);
  };

  const handleAddReadingsToChart = () => {
    if (!isSignedIn) {
      setUploadError("Sign in to add readings to the chart.");
      return;
    }
    if (!selectedPatient) return;
    const readings = buildSimulatedGumGaugeReadings();
    const newExam: GumGaugeExam = {
      id: crypto.randomUUID(),
      scanDate: new Date().toISOString().slice(0, 10),
      teeth: readings,
    };
    const existing = selectedPatient.gumGaugeExams ?? [];
    updatePatient(selectedPatient.id, { gumGaugeExams: [...existing, newExam] });
    setUploadError("");
    setRefreshKey((k) => k + 1);
    setSelectedExamId(newExam.id);
  };

  const handleEndScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setScanInProgress(false);
    setScanComplete(false);
    setFlashStep(0);
    setUploadError("");
  };

  useEffect(() => () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
  }, []);

  useEffect(() => {
    setSelectedExamId(null);
    setSelectedTooth(null);
  }, [selectedPatientId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setUploadError("");
    setUploadSuccess("");
    if (!file) return;
    if (!selectedPatient) {
      setUploadError("Select a patient first, then upload the scan file.");
      return;
    }
    if (currentImages.length >= 10) {
      setUploadError("This patient already has the maximum of 10 images. Remove one from their chart first.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setUploadError(`File must be under ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newImage: PatientImage = {
        id: crypto.randomUUID(),
        label: `GumGauge Scan ${new Date().toISOString().slice(0, 10)}`,
        type: "GumGauge Scan",
        dataUrl,
        dateAdded: new Date().toISOString(),
      };
      const nextImages = [...(selectedPatient.patientImages ?? []), newImage];
      updatePatient(selectedPatient.id, { patientImages: nextImages });
      setScanComplete(false);
      setUploadSuccess(`Scan file added to ${selectedPatient.firstName} ${selectedPatient.lastName}'s chart. It will appear in their Images section.`);
      setRefreshKey((k) => k + 1);
      setTimeout(() => setUploadSuccess(""), 5000);
    };
    reader.onerror = () => setUploadError("Could not read the file.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-navy mb-2">Device Scan</h1>
      <p className="text-navy/70 mb-6">
        Connect the GumGauge scanning device, select a patient, run the scan, and upload results to the patient&apos;s scan files.
      </p>

      <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-6 space-y-6 max-w-2xl">
        <section>
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wide mb-3">1. Connect device</h2>
          {!deviceConnected ? (
            <button
              type="button"
              onClick={handleConnect}
              className="px-4 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy-light"
            >
              Connect GumGauge device
            </button>
          ) : (
            <p className="text-green-700 font-medium flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-green-600" />
              Device connected (simulated)
            </p>
          )}
          {deviceConnected && (
            <div className="mt-3 p-3 bg-sky/10 rounded-lg border border-sky/30">
              <label className="block text-sm font-medium text-navy mb-1">Light / brightness (%)</label>
              <p className="text-xs text-navy/60 mb-1">Adjusts device LED intensity. When connected via serial, this value is sent to the hardware.</p>
              <input
                type="range"
                min={0}
                max={100}
                value={brightnessPercent}
                onChange={(e) => setBrightnessPercent(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none bg-sky/30 accent-navy"
              />
              <span className="text-sm font-medium text-navy">{brightnessPercent}%</span>
            </div>
          )}
          <p className="text-xs text-navy/60 mt-1">In production, this would link to the hardware via USB/Bluetooth.</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wide mb-3">2. Select patient</h2>
          <select
            value={selectedPatientId}
            onChange={(e) => {
              setSelectedPatientId(e.target.value);
              setScanComplete(false);
            }}
            className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white"
          >
            <option value="">— Select patient for this scan —</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
              </option>
            ))}
          </select>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wide mb-3">3. Run scan</h2>
          {!isSignedIn && (
            <p className="text-amber-700 text-sm mb-2">
              <Link to={`/signin?returnTo=${encodeURIComponent(signInReturnTo)}`} className="font-medium hover:underline">Sign in</Link> to run a scan or add readings to the chart.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleStartScan}
              disabled={!isSignedIn || !selectedPatientId || !deviceConnected || scanInProgress}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scanInProgress ? "Scanning…" : "Start procedure"}
            </button>
          </div>
          {scanInProgress && (
            <div className="mt-4 p-4 bg-sky/10 rounded-xl border border-sky/40">
              <p className="text-sm font-medium text-navy mb-2">
                {flashStep < 4 ? "Preparing…" : flashStep < 7 ? "Scanning…" : "Complete"}
                {flashStep < TOTAL_FLASHES && ` (step ${flashStep + 1}/${TOTAL_FLASHES})`}
              </p>
              {/* Device scan light: flashes lower (dimmer) and takes ~8s to complete */}
              <div
                className={`h-3 w-full rounded overflow-hidden transition-all duration-500 ${
                  flashStep >= 6 ? "bg-green-600 opacity-90" : flashStep >= 3 ? "bg-amber-500 opacity-60" : "bg-amber-400 opacity-40"
                } ${flashStep < TOTAL_FLASHES ? "animate-pulse" : ""}`}
                role="progressbar"
                aria-valuenow={flashStep + 1}
                aria-valuemin={0}
                aria-valuemax={TOTAL_FLASHES}
                aria-label="Scan progress"
              />
              <p className="text-xs text-navy/60 mt-1">
                {flashStep >= TOTAL_FLASHES - 1 ? "Scan complete. Add readings to chart below." : "Device light flashing (scan in progress, ~8 sec total)."}
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {(scanInProgress || scanComplete) && (
              <button
                type="button"
                onClick={handleEndScan}
                className="px-4 py-2 border border-sky/60 text-navy rounded-lg font-medium hover:bg-sky/10"
              >
                End scan
              </button>
            )}
          </div>
          {scanComplete && (
            <>
              <p className="text-green-700 font-medium mt-2 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-green-600" />
                Scan complete.
              </p>
              <p className="text-xs text-navy/70 mt-1 mb-2">
                Add device readings (light penetration %, health per tooth) to the patient chart. They will appear in the Perio charting section.
              </p>
              <button
                type="button"
                onClick={handleAddReadingsToChart}
                disabled={!isSignedIn}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add GumGauge readings to chart
              </button>
            </>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wide mb-3">4. Upload result to patient</h2>
          <p className="text-xs text-navy/60 mb-2">
            Save the scan result directly to the patient&apos;s images. It will appear as &quot;GumGauge Scan&quot; in their chart.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!selectedPatientId || !canAddImage}
            className="px-4 py-2 bg-sky-dark text-white rounded-lg font-medium hover:bg-navy disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload scan file
          </button>
          {!canAddImage && selectedPatientId && (
            <p className="text-amber-700 text-sm mt-1">This patient has reached the maximum of 10 images. Remove one from their chart first.</p>
          )}
          {uploadSuccess && (
            <p className="text-green-700 text-sm mt-2 font-medium" role="status">{uploadSuccess}</p>
          )}
          {uploadError && (
            <p className="text-red-600 text-sm mt-2" role="alert">{uploadError}</p>
          )}
        </section>

        {selectedPatient && gumGaugeExams.length > 0 && (
          <section className="rounded-xl border border-sky/40 bg-green-50/50 p-4">
            <h2 className="text-sm font-semibold text-navy uppercase tracking-wide mb-3">View scan results</h2>
            <p className="text-xs text-navy/60 mb-3">
              Interactive 3D mouth: drag to rotate, scroll to zoom. Teeth colored by scan health (green / amber / red). Click a tooth to see details below.
            </p>
            <div className="mb-4">
              <Mouth3DView
                readings={(gumGaugeExams.find((e) => e.id === (selectedExamId ?? gumGaugeExams[gumGaugeExams.length - 1]?.id)) ?? gumGaugeExams[gumGaugeExams.length - 1])?.teeth ?? []}
                selectedTooth={selectedTooth}
                onSelectTooth={setSelectedTooth}
              />
            </div>
            <p className="text-xs text-navy/60 mb-3">
              Select a scan date and click a tooth to see light penetration % and health. Compare past scans with the dropdown.
            </p>
            <GumGaugeMouthView
              exams={gumGaugeExams}
              selectedExamId={selectedExamId ?? gumGaugeExams[gumGaugeExams.length - 1]?.id ?? null}
              onSelectExamId={setSelectedExamId}
              selectedTooth={selectedTooth}
              onSelectTooth={setSelectedTooth}
            />
          </section>
        )}

        {selectedPatient && (
          <section>
            <h2 className="text-sm font-semibold text-navy uppercase tracking-wide mb-2">Patient chart</h2>
            <Link
              to={`/dashboard/patients/${selectedPatient.id}`}
              className="text-sky-dark font-medium hover:underline"
            >
              Open {selectedPatient.firstName} {selectedPatient.lastName}&apos;s chart →
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
