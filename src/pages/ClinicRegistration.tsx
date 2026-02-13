import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getClinic } from "../storage/clinicStorage";
import { addPendingClinicRegistration } from "../storage/pendingClinicStorage";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming",
];

const COMMON_CITIES = [
  "Austin", "Houston", "Dallas", "San Antonio", "Fort Worth", "El Paso", "Arlington",
  "New York", "Los Angeles", "Chicago", "Phoenix", "Philadelphia", "San Diego",
  "San Jose", "Jacksonville", "Columbus", "Charlotte", "Indianapolis", "Seattle",
  "Denver", "Boston", "Nashville", "Detroit", "Portland", "Las Vegas", "Memphis",
  "Louisville", "Baltimore", "Milwaukee", "Albuquerque", "Tucson", "Fresno",
  "Sacramento", "Kansas City", "Mesa", "Atlanta", "Omaha", "Miami", "Oakland",
  "Minneapolis", "Cleveland", "Wichita", "Arlington", "Tampa", "Honolulu",
  "Aurora", "Anaheim", "Santa Ana", "St. Louis", "Riverside", "Corpus Christi",
  "Pittsburgh", "Lexington", "Anchorage", "Stockton", "Cincinnati", "St. Paul",
  "Toledo", "Newark", "Plano", "Henderson", "Lincoln", "Buffalo", "Fort Wayne",
  "Jersey City", "St. Petersburg", "Chula Vista", "Orlando", "Laredo", "Chandler",
  "Madison", "Lubbock", "Scottsdale", "Reno", "Durham", "Winston-Salem",
  "Gilbert", "Glendale", "North Las Vegas", "Irving", "Fremont", "Boise",
  "Richmond", "San Bernardino", "Birmingham", "Spokane", "Rochester", "Des Moines",
  "Modesto", "Fayetteville", "Tacoma", "Oxnard", "Fontana", "Columbus", "Montgomery",
  "Moreno Valley", "Salt Lake City", "Little Rock", "Augusta", "Grand Rapids",
  "Tallahassee", "Huntsville", "Grand Prairie", "Knoxville", "Worcester", "Newport News",
  "Brownsville", "Santa Clarita", "Overland Park", "Providence", "Garden Grove",
  "Santa Rosa", "Chattanooga", "Oceanside", "Fort Lauderdale", "Rancho Cucamonga",
  "Santa Clara", "Port St. Lucie", "Vancouver", "Tempe", "Springfield", "Cape Coral",
  "Pembroke Pines", "Sioux Falls", "Peoria", "Lancaster", "Elk Grove", "Palmdale",
  "Salinas", "Springfield", "Pomona", "Pasadena", "Joliet", "Paterson", "Kansas City",
  "Torrance", "Syracuse", "Bridgeport", "Hayward", "Fort Collins", "Corona",
  "Rockford", "Savannah", "Mesquite", "Sunnyvale", "Pasadena", "Orange", "Naples",
  "Aurora", "Dayton", "Hampton", "Hollywood", "Killeen", "McKinney", "Lakewood",
];

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

  const resetForm = () => {
    setName("");
    setAddress("");
    setCity("");
    setState("");
    setZip("");
    setPhone("");
    setDeviceCount("1");
  };

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
    resetForm();
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
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="w-full px-3 py-2 border border-sky/60 rounded-lg"
              list="city-list"
              autoComplete="off"
            />
            <datalist id="city-list">
              {COMMON_CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="State"
              className="w-full px-3 py-2 border border-sky/60 rounded-lg"
              list="state-list"
              autoComplete="off"
            />
            <datalist id="state-list">
              {US_STATES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
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
