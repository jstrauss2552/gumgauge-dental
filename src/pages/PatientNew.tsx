import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { addPatient } from "../storage";
import { APPOINTMENT_TYPES } from "../types";
import { TOP_INSURANCE_PROVIDERS, INSURANCE_OTHER } from "../constants/insuranceProviders";

const empty = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  phone: "",
  email: "",
  address: "",
  allergies: "",
  medicalConditions: "",
  currentMedications: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  insuranceProvider: "",
  insuranceOther: "",
  insurancePlan: "",
  appointmentTypeOther: "",
  insuranceMemberId: "",
  insuranceGroupNumber: "",
  dateOfAppointment: new Date().toISOString().slice(0, 10),
  appointmentTime: "",
  dateOfNextAppointment: "",
  nextAppointmentTime: "",
  appointmentType: "",
  appointmentDoctor: "",
  chiefComplaint: "",
  treatmentPlan: "",
  lastCleaningDate: "",
  dentistNotes: "",
};

export default function PatientNew() {
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);

  const update = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const toOptional = (s: string) => (s.trim() ? s.trim() : undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = addPatient({
      firstName: form.firstName,
      lastName: form.lastName,
      dateOfBirth: form.dateOfBirth,
      phone: toOptional(form.phone),
      email: toOptional(form.email),
      address: toOptional(form.address),
      allergies: toOptional(form.allergies),
      medicalConditions: toOptional(form.medicalConditions),
      currentMedications: toOptional(form.currentMedications),
      emergencyContactName: toOptional(form.emergencyContactName),
      emergencyContactPhone: toOptional(form.emergencyContactPhone),
      insuranceProvider: toOptional(form.insuranceProvider === INSURANCE_OTHER ? form.insuranceOther : form.insuranceProvider),
      insurancePlan: toOptional(form.insurancePlan),
      insuranceMemberId: toOptional(form.insuranceMemberId),
      insuranceGroupNumber: toOptional(form.insuranceGroupNumber),
      dateOfAppointment: form.dateOfAppointment,
      dateOfNextAppointment: form.dateOfNextAppointment || "",
      appointmentTime: toOptional(form.appointmentTime),
      nextAppointmentTime: toOptional(form.nextAppointmentTime),
      appointmentType: toOptional(form.appointmentType),
      appointmentTypeOther: form.appointmentType === "Other" ? toOptional(form.appointmentTypeOther) : undefined,
      appointmentDoctor: toOptional(form.appointmentDoctor),
      chiefComplaint: toOptional(form.chiefComplaint),
      treatmentPlan: toOptional(form.treatmentPlan),
      lastCleaningDate: toOptional(form.lastCleaningDate),
      dentistNotes: form.dentistNotes,
    });
    navigate(`/dashboard/patients/${patient.id}`, { replace: true });
  };

  const section = (title: string, children: React.ReactNode) => (
    <section>
      <h2 className="text-sm font-semibold text-navy uppercase tracking-wide mb-3">{title}</h2>
      {children}
    </section>
  );

  return (
    <div className="p-8">
      <Link to="/dashboard/patients" className="text-sky-dark text-sm font-medium hover:underline mb-4 inline-block">
        ← Patients
      </Link>
      <h1 className="text-2xl font-semibold text-navy mb-6">New patient</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-sky/40 p-6 space-y-6 max-w-2xl">
        {section("Demographics", (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm text-navy/70 mb-1">First name *</label><input required value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" /></div>
            <div><label className="block text-sm text-navy/70 mb-1">Last name *</label><input required value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" /></div>
            <div><label className="block text-sm text-navy/70 mb-1">Date of birth *</label><input required type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" /></div>
            <div><label className="block text-sm text-navy/70 mb-1">Phone</label><input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" /></div>
            <div><label className="block text-sm text-navy/70 mb-1">Email</label><input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" /></div>
            <div className="md:col-span-2"><label className="block text-sm text-navy/70 mb-1">Address</label><input value={form.address} onChange={(e) => update("address", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" /></div>
          </div>
        ))}

        {section("Medical history", (
          <>
            <p className="text-xs text-navy/60 mb-2">Allergies, conditions, and medications relevant to dental treatment</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm text-navy/70 mb-1">Allergies</label><input value={form.allergies} onChange={(e) => update("allergies", e.target.value)} placeholder="e.g. Penicillin, latex" className="w-full px-3 py-2 border border-sky/60 rounded-lg" /></div>
              <div><label className="block text-sm text-navy/70 mb-1">Medical conditions</label><input value={form.medicalConditions} onChange={(e) => update("medicalConditions", e.target.value)} placeholder="e.g. Diabetes, hypertension" className="w-full px-3 py-2 border border-sky/60 rounded-lg" /></div>
              <div><label className="block text-sm text-navy/70 mb-1">Current medications</label><input value={form.currentMedications} onChange={(e) => update("currentMedications", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" /></div>
              <div><label className="block text-sm text-navy/70 mb-1">Emergency contact name</label><input value={form.emergencyContactName} onChange={(e) => update("emergencyContactName", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" /></div>
              <div className="md:col-span-2"><label className="block text-sm text-navy/70 mb-1">Emergency contact phone</label><input value={form.emergencyContactPhone} onChange={(e) => update("emergencyContactPhone", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" /></div>
            </div>
          </>
        ))}

        {section("Insurance", (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-navy/70 mb-1">Insurance provider</label>
              <select value={form.insuranceProvider} onChange={(e) => update("insuranceProvider", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white">
                <option value="">Select provider</option>
                {TOP_INSURANCE_PROVIDERS.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
                <option value={INSURANCE_OTHER}>{INSURANCE_OTHER}</option>
              </select>
              {form.insuranceProvider === INSURANCE_OTHER && (
                <div className="mt-3">
                  <label className="block text-sm text-navy/70 mb-1">Custom provider name</label>
                  <input
                    type="text"
                    autoComplete="off"
                    value={form.insuranceOther}
                    onChange={(e) => update("insuranceOther", e.target.value)}
                    placeholder="Type insurance provider name"
                    className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white text-navy"
                  />
                </div>
              )}
            </div>
            <div><label className="block text-sm text-navy/70 mb-1">Plan name</label><input value={form.insurancePlan} onChange={(e) => update("insurancePlan", e.target.value)} placeholder="Select plan" className="w-full px-3 py-2 border border-sky/60 rounded-lg" /></div>
            <div><label className="block text-sm text-navy/70 mb-1">Member ID</label><input value={form.insuranceMemberId} onChange={(e) => update("insuranceMemberId", e.target.value)} placeholder="Member ID" className="w-full px-3 py-2 border border-sky/60 rounded-lg" /></div>
            <div><label className="block text-sm text-navy/70 mb-1">Group number</label><input value={form.insuranceGroupNumber} onChange={(e) => update("insuranceGroupNumber", e.target.value)} placeholder="Group number" className="w-full px-3 py-2 border border-sky/60 rounded-lg" /></div>
          </div>
        ))}

        {section("Appointments", (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm text-navy/70 mb-1">Date of appointment *</label><input required type="date" value={form.dateOfAppointment} onChange={(e) => update("dateOfAppointment", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" /></div>
            <div><label className="block text-sm text-navy/70 mb-1">Appointment time</label><input type="time" value={form.appointmentTime} onChange={(e) => update("appointmentTime", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" /></div>
            <div><label className="block text-sm text-navy/70 mb-1">Date of next appointment</label><input type="date" value={form.dateOfNextAppointment} onChange={(e) => update("dateOfNextAppointment", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" /></div>
            <div><label className="block text-sm text-navy/70 mb-1">Next appointment time</label><input type="time" value={form.nextAppointmentTime} onChange={(e) => update("nextAppointmentTime", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" /></div>
            <div>
              <label className="block text-sm text-navy/70 mb-1">Appointment type</label>
              <select value={form.appointmentType} onChange={(e) => update("appointmentType", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white">
                <option value="">—</option>
                {APPOINTMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {form.appointmentType === "Other" && (
                <div className="mt-2">
                  <label className="block text-sm text-navy/70 mb-1">Describe appointment type (free response)</label>
                  <input
                    type="text"
                    value={form.appointmentTypeOther}
                    onChange={(e) => update("appointmentTypeOther", e.target.value)}
                    placeholder="e.g. Implant consultation, TMJ follow-up"
                    className="w-full px-3 py-2 border border-sky/60 rounded-lg"
                  />
                </div>
              )}
            </div>
            <div><label className="block text-sm text-navy/70 mb-1">Doctor (performing appointment)</label><input value={form.appointmentDoctor} onChange={(e) => update("appointmentDoctor", e.target.value)} placeholder="e.g. Dr. Smith" className="w-full px-3 py-2 border border-sky/60 rounded-lg" /></div>
          </div>
        ))}

        {section("Clinical", (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm text-navy/70 mb-1">Chief complaint</label><input value={form.chiefComplaint} onChange={(e) => update("chiefComplaint", e.target.value)} placeholder="Reason for visit" className="w-full px-3 py-2 border border-sky/60 rounded-lg" /></div>
            <div><label className="block text-sm text-navy/70 mb-1">Last cleaning date</label><input type="date" value={form.lastCleaningDate} onChange={(e) => update("lastCleaningDate", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" /></div>
            <div className="md:col-span-2"><label className="block text-sm text-navy/70 mb-1">Treatment plan</label><textarea value={form.treatmentPlan} onChange={(e) => update("treatmentPlan", e.target.value)} rows={3} placeholder="Planned treatment" className="w-full px-3 py-2 border border-sky/60 rounded-lg resize-y" /></div>
          </div>
        ))}

        {section("Dentist's notes", (
          <textarea value={form.dentistNotes} onChange={(e) => update("dentistNotes", e.target.value)} rows={4} placeholder="Clinical notes, procedures performed, charting notes, etc." className="w-full px-3 py-2 border border-sky/60 rounded-lg resize-y" />
        ))}

        <div className="flex gap-3">
          <button type="submit" className="px-4 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy-light">
            Save patient
          </button>
          <Link to="/dashboard/patients" className="px-4 py-2 border border-navy/30 rounded-lg font-medium inline-block">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
