# Biogas Lab MIS

A Laboratory Management Information System for biogas research labs.
Built with React + Vite + Firebase.

---

## Tech Stack
- React 18 + Vite
- Tailwind CSS
- Firebase Auth + Firestore
- Recharts (charts)
- jsPDF + jspdf-autotable (PDF export)
- SheetJS / xlsx (Excel export)

---

## Setup Instructions

### 1. Install Node.js
Download from https://nodejs.org (v18 or higher)

### 2. Create Firebase Project
1. Go to https://console.firebase.google.com
2. Create a new project (e.g. "biogas-mis")
3. Go to Authentication → Sign-in method → Enable Email/Password
4. Go to Firestore Database → Create database → Start in test mode
5. Go to Project Settings → Your Apps → Add Web App
6. Copy the firebaseConfig values

### 3. Configure Environment Variables
Open the `.env` file and paste your Firebase config:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Install Dependencies
Open a terminal inside the `biogas-mis` folder and run:

```bash
npm install
```

### 5. Run the App
```bash
npm run dev
```

Open your browser at: http://localhost:5173

### 6. Apply Firestore Security Rules
1. Go to Firebase Console → Firestore → Rules
2. Copy and paste the contents of `firestore.rules`
3. Click Publish

---

## Firestore Collections

| Collection      | Module              | Description                  |
|----------------|---------------------|------------------------------|
| users           | Auth                | User profiles and roles      |
| bmp_samples     | Biomethane / BMP    | BMP test results             |
| water_quality   | Water & Wastewater  | Water quality parameters     |
| wastewater      | Water & Wastewater  | Wastewater (BOD, COD, TSS)   |
| soil_samples    | Soil & Fertilizer   | NPK and soil pH data         |

---

## Folder Structure

```
src/
├── firebase.js          ← Firebase init
├── main.jsx             ← Entry point
├── App.jsx              ← Router + auth guard
├── index.css            ← Global styles + Tailwind
├── hooks/
│   └── useAuth.js       ← Auth state listener
├── components/
│   ├── Sidebar.jsx      ← Navigation sidebar
│   ├── SampleTable.jsx  ← Reusable records table
│   └── DeleteModal.jsx  ← Confirm delete dialog
└── pages/
    ├── Login.jsx        ← Login + Register
    ├── Dashboard.jsx    ← Overview + activity feed
    ├── Biomethane.jsx   ← BMP module
    ├── Water.jsx        ← Water & wastewater module
    ├── Soil.jsx         ← Soil & fertilizer module
    └── Reports.jsx      ← Report generation + export
```

---

## Features
- Login / Register with Firebase Auth
- Role-based users (Admin, Lab Tech, Researcher)
- Add, view, and delete samples per module
- Real-time data from Firestore
- Export reports as PDF, Excel, or CSV
- Runs fully local — no internet needed after setup
