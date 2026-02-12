import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getClinic } from "../storage/clinicStorage";
import { addPendingClinicRegistration } from "../storage/pendingClinicStorage";

export default function ClinicRegistration() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  const [deviceCount, setDeviceCount] = useState("1");
  const [submitted, setSubmitted] = useState(false);

  const assignedClinic = getClinic();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(deviceCount, 10);
    addPendingClinicRegistration({
      name: name.trim(),
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      zip: zip.trim() || undefined,
      phone: phone.trim() || undefined,
      deviceCount: Number.isNaN(num) || num < 1 ? 1 : num,
    });
    setSubmitted(true);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-navy mb-2">Clinic / Office Registration</h1>
      <p className="text-navy/70 mb-6">
        Submit your office info to GumGauge. Company admin will review and assign your clinic; once approved, your clinic name will appear on the dashboard.
      </p>

      {assignedClinic && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm font-medium text-green-800">This device is assigned to: <strong>{assignedClinic.name}</strong></p>
          <p className="text-xs text-green-700 mt-1">To change details, submit the form below; admin can reassign.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-sky/40 p-6 max-w-xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Clinic name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Smile Dental Care"
            className="w-full px-3 py-2 border border-sky/60 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street address"
            className="w-full px-3 py-2 border border-sky/60 rounded-lg"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">City</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">State</label>
            <input type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1">ZIP</label>
          <input type="text" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="ZIP code" className="w-full px-3 py-2 border border-sky/60 rounded-lg max-w-[120px]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Phone</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Number of GumGauge devices</label>
          <input type="number" min={1} value={deviceCount} onChange={(e) => setDeviceCount(e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg max-w-[100px]" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-4 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy-light">
            Submit for approval
          </button>
          <Link to="/dashboard" className="px-4 py-2 border border-navy/30 rounded-lg font-medium inline-block">
            Back to dashboard
          </Link>
        </div>
        {submitted && (
          <p className="text-green-700 text-sm mt-2">Submitted. GumGauge admin will review and assign your clinic.</p>
        )}
      </form>
    </div>
  );
}
