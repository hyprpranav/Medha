// ─── MEDHA'26 Launch Dashboard Controller ────────────────────────────────────
import { triggerLaunch, resetLaunch, onLaunchSignal, getLaunchState } from "./firebase-sync.js";

const launchBtn   = document.getElementById("launch-btn");
const btnHint     = document.getElementById("btn-hint");
const resetBtn    = document.getElementById("reset-btn");
const connDot     = document.getElementById("conn-dot");
const connText    = document.getElementById("conn-text");

let launched = false;

// ── Connection status ────────────────────────────────────────────────────────
const setConnected = () => {
  connDot.classList.add("connected");
  connDot.classList.remove("error");
  connText.textContent = "Connected to Firebase";
};

const setError = (msg) => {
  connDot.classList.add("error");
  connDot.classList.remove("connected");
  connText.textContent = msg || "Connection error";
};

// ── UI states ────────────────────────────────────────────────────────────────
const setReady = () => {
  launchBtn.disabled = false;
  btnHint.textContent = "Tap to start the show on all screens";
  btnHint.style.color = "rgba(59, 242, 255, 0.6)";
};

const setLaunched = () => {
  launched = true;
  launchBtn.disabled = true;
  launchBtn.classList.add("launched");
  const label = launchBtn.querySelector(".launch-label");
  if (label) label.innerHTML = "LAUNCHED<br/>&#10003;";
  btnHint.textContent = "Show is running on all screens!";
  btnHint.style.color = "#00e87a";
};

const setIdle = () => {
  launched = false;
  launchBtn.disabled = false;
  launchBtn.classList.remove("launched");
  const label = launchBtn.querySelector(".launch-label");
  if (label) label.innerHTML = "LAUNCH<br/>MEDHA\u201926";
  btnHint.textContent = "Tap to start the show on all screens";
  btnHint.style.color = "rgba(59, 242, 255, 0.6)";
};

// ── Launch button ────────────────────────────────────────────────────────────
launchBtn.addEventListener("click", async () => {
  if (launched) return;
  launchBtn.disabled = true;
  btnHint.textContent = "Sending launch signal…";

  try {
    await triggerLaunch();
    // onLaunchSignal callback will update UI
  } catch (err) {
    console.error("Launch failed:", err);
    setError("Launch failed — check connection");
    launchBtn.disabled = false;
  }
});

// ── Reset button ─────────────────────────────────────────────────────────────
resetBtn.addEventListener("click", async () => {
  try {
    await resetLaunch();
    setIdle();
  } catch (err) {
    console.error("Reset failed:", err);
    setError("Reset failed — check connection");
  }
});

// ── Firebase listener ────────────────────────────────────────────────────────
// This fires immediately with the current value, then on every change.
try {
  onLaunchSignal(() => {
    setConnected();
    setLaunched();
  });

  // Also detect when it goes back to non-triggered (after reset)
  import("https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js").then(
    ({ getDatabase, ref, onValue }) => {
      const db = getDatabase();
      onValue(ref(db, "medha26/launch"), (snap) => {
        setConnected(); // any response = connected
        const data = snap.val();
        if (!data || data.triggered === false) {
          setIdle();
        } else if (data.triggered === true) {
          setLaunched();
        }
      });
    }
  );
} catch (err) {
  setError("Firebase not configured");
}

// Quick initial connection test
getLaunchState()
  .then((data) => {
    setConnected();
    if (data && data.triggered) {
      setLaunched();
    } else {
      setReady();
    }
  })
  .catch(() => {
    setError("Cannot reach Firebase — check config & Wi-Fi");
  });
