// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  MEDHA'26 — Firebase Cross-Device Sync                                  ║
// ║                                                                         ║
// ║  HOW TO SET UP:                                                         ║
// ║  1. Go to  https://console.firebase.google.com                          ║
// ║  2. Create a new project (name it anything, e.g. "medha26")             ║
// ║  3. In the project, go to Build → Realtime Database → Create Database   ║
// ║  4. Choose "Start in TEST mode" (so any device can read/write)          ║
// ║  5. Go to Project Settings → General → Your apps → Add Web App (</>)   ║
// ║  6. Copy the firebaseConfig object and paste it below                   ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  set,
  get,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ─── Your Firebase project config ────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyDD7MopS99HPdrFvD0m99qdz9AaeXDQwVY",
  authDomain:        "medha-launch.firebaseapp.com",
  databaseURL:       "https://medha-launch-default-rtdb.firebaseio.com",
  projectId:         "medha-launch",
  storageBucket:     "medha-launch.firebasestorage.app",
  messagingSenderId: "650852722099",
  appId:             "1:650852722099:web:cc69bb3a9272b00ea1d7c6",
};
// ─────────────────────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

const LAUNCH_PATH = "medha26/launch";
const launchRef   = ref(db, LAUNCH_PATH);

// ─── Dashboard: trigger the launch ──────────────────────────────────────────
export const triggerLaunch = () =>
  set(launchRef, { triggered: true, timestamp: Date.now() });

// ─── Dashboard: reset (so you can re-run the show) ──────────────────────────
export const resetLaunch = () =>
  set(launchRef, { triggered: false, timestamp: 0 });

// ─── Screen: listen for launch signal ───────────────────────────────────────
export const onLaunchSignal = (callback) => {
  onValue(launchRef, (snapshot) => {
    const data = snapshot.val();
    if (data && data.triggered === true) {
      callback(data);
    }
  });
};

// ─── Read current state once ────────────────────────────────────────────────
export const getLaunchState = async () => {
  const snapshot = await get(launchRef);
  return snapshot.val();
};
