import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { TimezoneProvider } from "./contexts/TimezoneContext";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Splash from "./pages/Splash";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import PatientList from "./pages/PatientList";
import PatientChart from "./pages/PatientChart";
import PatientNew from "./pages/PatientNew";
import Appointments from "./pages/Appointments";
import StaffList from "./pages/StaffList";
import StaffNew from "./pages/StaffNew";
import StaffDetail from "./pages/StaffDetail";
import MyPatients from "./pages/MyPatients";
import DeviceScan from "./pages/DeviceScan";
import RecallReport from "./pages/RecallReport";
import AuditLog from "./pages/AuditLog";
import Billing from "./pages/Billing";
import Analytics from "./pages/Analytics";
import ClinicRegistration from "./pages/ClinicRegistration";
import ClinicLog from "./pages/ClinicLog";
import Backup from "./pages/Backup";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <TimezoneProvider>
    <AuthProvider>
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/dashboard" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="patients" element={<PatientList />} />
        <Route path="patients/new" element={<PatientNew />} />
        <Route path="patients/:id" element={<PatientChart />} />
        <Route path="staff" element={<StaffList />} />
        <Route path="staff/new" element={<StaffNew />} />
        <Route path="staff/:id" element={<StaffDetail />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="billing" element={<Billing />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="my-patients" element={<MyPatients />} />
        <Route path="device-scan" element={<DeviceScan />} />
        <Route path="recall" element={<RecallReport />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="backup" element={<Backup />} />
        <Route path="clinic" element={<ClinicRegistration />} />
        <Route path="clinic-log" element={<ClinicLog />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </AuthProvider>
    </TimezoneProvider>
  );
}
