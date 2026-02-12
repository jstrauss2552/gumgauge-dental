# GumGauge Dental

A simple, organized dental practice management app for storing patient files, charts, and appointments.

## Features

- **Dashboard** – Overview of total patients, today’s appointments, and upcoming next appointments
- **Patients** – List with search; add, edit, and view patient charts
- **Patient charts** – Name, date of birth, contact info, date of appointment, date of next appointment, dentist’s notes
- **Appointments** – View today, upcoming, or all appointments
- **Theme** – Navy blue, sky blue, and white
- **Left navigation** – Dashboard, Patients, Appointments
- **Launch screen** – GumGauge branding when you open the app

## Logo

The GumGauge logo is included as **`public/logo.pdf`** and is shown in the app (sidebar and launch screen). If the PDF cannot be loaded, a “GG” placeholder is shown instead.

## Run the app

```bash
cd gumgauge-dental
npm install
npm run dev
```

Open **http://localhost:5174** in your browser. You’ll see the GumGauge launch screen, then the dashboard.

## Data

Patient data is stored in your browser’s **localStorage** (no server required). To keep data when changing browsers or devices, consider backing it up or adding a future cloud/sync option.

## Build for production

```bash
npm run build
```

Output is in `dist/`. Serve that folder with any static host.
