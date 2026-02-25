const countdownNumberEl = document.getElementById("countdown-number");
const countdownStageEl = document.getElementById("countdown-stage");
const revealStageEl = document.getElementById("reveal-stage");
const letterGridEl = document.getElementById("letter-grid");
const subtitleEl = document.getElementById("subtitle");
const taglineEl = document.getElementById("tagline");
const blackoutEl = document.getElementById("blackout");
const audioToggleEl = document.getElementById("audio-toggle");
const videoOverlayEl  = document.getElementById("video-overlay");
const introVideoEl    = document.getElementById("intro-video");
const videoSkipEl     = document.getElementById("video-skip");
const videoPlayBtnEl  = document.getElementById("video-play-btn");
const videoPlayScreen = document.getElementById("video-play-screen");

const countdownSequence = [
  { value: 10, effect: "spark", sfx: "Electric spark" },
  { value: 9, effect: "glitch", sfx: "Digital glitch" },
  { value: 8, effect: "ripple", sfx: "Energy ripple" },
  { value: 7, effect: "shine", sfx: "Metallic shine" },
  { value: 6, effect: "burst", sfx: "Particle burst" },
  { value: 5, effect: "bass", sfx: "Deep bass" },
  { value: 4, effect: "zoom", sfx: "Camera push" },
  { value: 3, effect: "tension", sfx: "Rising tension" },
  { value: 2, effect: "heartbeat", sfx: "Heartbeat bass" },
  { value: 1, effect: "flicker", sfx: "Light flicker" },
  { value: 0, effect: "disperse", sfx: "Silence" },
];

const letterSequence = [
  { id: "M", effect: "rise", delay: 0 },
  { id: "E", effect: "wave", delay: 1000 },
  { id: "D", effect: "slam", delay: 2000 },
  { id: "H", effect: "shine", delay: 3000 },
  { id: "A", effect: "flare", delay: 4000 },
  { id: "26", effect: "impact", delay: 5000 },
];


const createDriveCurve = (amount = 0.6) => {
  const samples = 1024;
  const curve = new Float32Array(samples);
  const k = amount * 100;
  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
};

const MOVIE_TRACK_PATH = "media/tamil-movie-bgm.mp3";
const MOVIE_TRACK_VOLUME = 0.5;

const MERGE_AUDIO_PATH = "merge/mix_22s (audio-joiner.com).mp3";
let mergeAudioEl = null;

let audioCtx;
let masterGain;
let masterCompressor;
let toneFilter;
let audioEnabled = false;
let countdownStarted = false;
let movieTrack;
let movieTrackNode;
let movieTrackReady = false;

const initAudio = async () => {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0;
  toneFilter = audioCtx.createBiquadFilter();
  toneFilter.type = "peaking";
  toneFilter.frequency.value = 2400;
  toneFilter.Q.value = 1.2;
  toneFilter.gain.value = 4;

  masterCompressor = audioCtx.createDynamicsCompressor();
  masterCompressor.threshold.value = -22;
  masterCompressor.knee.value = 24;
  masterCompressor.ratio.value = 3.5;
  masterCompressor.attack.value = 0.012;
  masterCompressor.release.value = 0.25;

  const lowCut = audioCtx.createBiquadFilter();
  lowCut.type = "highpass";
  lowCut.frequency.value = 28;

  const airTrim = audioCtx.createBiquadFilter();
  airTrim.type = "lowpass";
  airTrim.frequency.value = 12000;

  masterGain
    .connect(toneFilter)
    .connect(masterCompressor)
    .connect(airTrim)
    .connect(lowCut)
    .connect(audioCtx.destination);
  buildSoundtrack();
  setupMovieTrack();
};

const setupMovieTrack = () => {
  if (movieTrack || !audioCtx) {
    return;
  }
  movieTrack = new Audio(MOVIE_TRACK_PATH);
  movieTrack.loop = true;
  movieTrack.preload = "auto";
  movieTrack.crossOrigin = "anonymous";
  movieTrack.volume = MOVIE_TRACK_VOLUME;

  movieTrack.addEventListener("canplaythrough", () => {
    movieTrackReady = true;
    if (audioEnabled) {
      movieTrack.play().catch(() => {});
    }
  });

  movieTrack.addEventListener("error", () => {
    console.warn(
      `Tamil movie track could not be loaded from ${MOVIE_TRACK_PATH}. Place your audio file at that path.`
    );
  });

  movieTrackNode = audioCtx.createMediaElementSource(movieTrack);
  movieTrackNode.connect(masterGain);
};

const buildSoundtrack = () => {
  [42, 96, 168].forEach((freq, index) => createDroneLayer(freq, index));
  createPulseBass();
  createAirTexture();
};

const createDroneLayer = (freq, index) => {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  const pan = audioCtx.createStereoPanner();

  osc.type = "sawtooth";
  osc.frequency.value = freq;
  osc.detune.value = index * 7;

  filter.type = "lowpass";
  filter.frequency.value = freq * 4;
  filter.Q.value = 0.6;

  gain.gain.value = 0.025 + index * 0.012;

  pan.pan.value = (index - 1) * 0.35;

  osc.connect(filter).connect(gain).connect(pan).connect(masterGain);
  osc.start();
};

const createPulseBass = () => {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  const drive = audioCtx.createWaveShaper();

  osc.type = "sine";
  osc.frequency.value = 32;

  gain.gain.value = 0.08;

  lfo.type = "triangle";
  lfo.frequency.value = 0.5;
  lfoGain.gain.value = 0.03;

  drive.curve = createDriveCurve(0.35);
  drive.oversample = "4x";

  lfo.connect(lfoGain).connect(gain.gain);
  osc.connect(drive).connect(gain).connect(masterGain);

  lfo.start();
  osc.start();
};

const createAirTexture = () => {
  const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = audioCtx.createBufferSource();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();
  const pan = audioCtx.createStereoPanner();
  const shimmer = audioCtx.createBiquadFilter();

  noise.buffer = buffer;
  noise.loop = true;
  filter.type = "bandpass";
  filter.frequency.value = 2600;
  filter.Q.value = 0.7;

  shimmer.type = "highshelf";
  shimmer.frequency.value = 6000;
  shimmer.gain.value = -4;

  gain.gain.value = 0.008;
  pan.pan.value = 0.15;

  noise.connect(filter).connect(shimmer).connect(gain).connect(pan).connect(masterGain);
  noise.start();
};

const setAudioEnabled = (state) => {
  if (!audioCtx || !masterGain) {
    return;
  }
  audioEnabled = state;
  const now = audioCtx.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.linearRampToValueAtTime(state ? 0.35 : 0, now + 0.4);
  if (movieTrack && movieTrackReady) {
    if (state) {
      movieTrack.play().catch(() => {});
    } else {
      movieTrack.pause();
      movieTrack.currentTime = 0;
    }
  }
  if (audioToggleEl) {
    audioToggleEl.textContent = state ? "Sound: ON" : "Sound: OFF";
    audioToggleEl.setAttribute("aria-pressed", String(state));
    audioToggleEl.classList.toggle("active", state);
  }
};

const handleAudioToggle = async () => {
  if (!audioCtx) {
    await initAudio();
    setAudioEnabled(true);
    return;
  }

  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  setAudioEnabled(!audioEnabled);
};

const playCountdownHit = (value) => {
  if (!audioCtx || !audioEnabled) {
    return;
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  const pan = audioCtx.createStereoPanner();
  const now = audioCtx.currentTime;

  osc.type = "triangle";
  osc.frequency.setValueAtTime(110 + (10 - value) * 8, now);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.28, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  filter.type = "bandpass";
  filter.Q.value = 7;
  filter.frequency.setValueAtTime(900 + value * 12, now);

  pan.pan.value = (Math.random() - 0.5) * 0.4;

  osc.connect(filter).connect(gain).connect(pan).connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.6);
};

const playLetterAccent = (index) => {
  if (!audioCtx || !audioEnabled) {
    return;
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const highpass = audioCtx.createBiquadFilter();
  const now = audioCtx.currentTime;
  const pan = audioCtx.createStereoPanner();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(240 + index * 28, now);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.22, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

  const colorFilter = audioCtx.createBiquadFilter();
  colorFilter.type = "bandpass";
  colorFilter.frequency.value = 1200 + index * 90;
  colorFilter.Q.value = 8;

  highpass.type = "highpass";
  highpass.frequency.value = 380;

  pan.pan.value = -0.35 + index * 0.14;

  osc
    .connect(highpass)
    .connect(colorFilter)
    .connect(gain)
    .connect(pan)
    .connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.8);
};

const playFinalImpact = () => {
  if (!audioCtx || !audioEnabled) {
    return;
  }
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  const subCut = audioCtx.createBiquadFilter();
  const pan = audioCtx.createStereoPanner();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(65, now);
  osc.frequency.exponentialRampToValueAtTime(28, now + 1.2);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.7, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(780, now);
  filter.frequency.exponentialRampToValueAtTime(240, now + 1.4);
  filter.Q.value = 0.8;

  subCut.type = "highpass";
  subCut.frequency.value = 24;

  pan.pan.value = 0;

  osc.connect(subCut).connect(filter).connect(gain).connect(pan).connect(masterGain);
  osc.start(now);
  osc.stop(now + 1.6);

  playNoiseBurst();
};

const playNoiseBurst = () => {
  if (!audioCtx || !audioEnabled) {
    return;
  }
  const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.5, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  const now = audioCtx.currentTime;

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

  filter.type = "bandpass";
  filter.frequency.value = 520;
  filter.Q.value = 2.2;

  noise.buffer = buffer;
  noise.connect(filter).connect(gain).connect(masterGain);
  noise.start(now);
  noise.stop(now + 0.7);
};

const initMergeAudio = () => {
  if (mergeAudioEl) return;
  mergeAudioEl = new Audio(MERGE_AUDIO_PATH);
  mergeAudioEl.preload = "auto";
  mergeAudioEl.loop = false;
  mergeAudioEl.volume = 1.0;
};

const ensureAudioOn = async () => {
  if (!audioCtx) {
    await initAudio();
  } else if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }
  setAudioEnabled(true);
};

const resetLetterClasses = (el) => {
  el.classList.remove("rise", "wave", "slam", "shine", "flare", "impact");
};

const showNumber = ({ value, effect }) => {
  countdownNumberEl.textContent = value;
  // Strip all classes and force reflow so the animation fires fresh every tick
  countdownNumberEl.className = "countdown-number";
  countdownNumberEl.classList.remove("hidden");
  void countdownNumberEl.offsetWidth; // reflow
  countdownNumberEl.classList.add(effect);

  if (value === 0) {
    setTimeout(() => {
      countdownNumberEl.classList.add("hidden");
    }, 700);
  }

  playCountdownHit(value);
};

const blackout = (active) => {
  if (active) {
    document.body.classList.add("dimming");
    blackoutEl.classList.add("active");
  } else {
    document.body.classList.remove("dimming");
    blackoutEl.classList.remove("active");
  }
};

const showLetters = () => {
  revealStageEl.classList.add("active");
  letterSequence.forEach(({ id, effect, delay }, index) => {
    const letterEl = letterGridEl.querySelector(`[data-id="${id}"]`);
    if (!letterEl) {
      return;
    }
    setTimeout(() => {
      resetLetterClasses(letterEl);
      letterEl.classList.add("visible", effect);
      playLetterAccent(index);
      if (index === letterSequence.length - 1) {
        letterGridEl.classList.add("shockwave");
        setTimeout(() => letterGridEl.classList.remove("shockwave"), 1200);
        letterGridEl.classList.add("connected");
        playFinalImpact();
      }
    }, delay + 200);
  });

  const subtitleDelay = letterSequence[letterSequence.length - 1].delay + 1400;
  setTimeout(() => subtitleEl.classList.add("visible"), subtitleDelay);
  setTimeout(() => taglineEl.classList.add("visible"), subtitleDelay + 400);
};

// ─── Countdown launcher ───────────────────────────────────────────────────────
const startCountdown = async () => {
  if (countdownStarted) return;
  countdownStarted = true;

  // Make countdown stage visible
  countdownStageEl.classList.add("counting");
  countdownStageEl.removeAttribute("aria-hidden");
  revealStageEl.setAttribute("aria-hidden", "true");

  // Audio is optional – NEVER let it block the visual countdown
  try { await ensureAudioOn(); } catch (_) {}

  // Show 10 → 9 → … → 0, one number per second
  const LEAD = 300; // brief breathing room before first number
  countdownSequence.forEach((item, index) => {
    setTimeout(() => showNumber(item), LEAD + index * 1000);
  });

  // After last number + fade: blackout then reveal letters
  const blackoutStart = LEAD + countdownSequence.length * 1000;
  setTimeout(() => {
    blackout(true);
  }, blackoutStart);
  setTimeout(() => {
    countdownStageEl.setAttribute("aria-hidden", "true");
    revealStageEl.setAttribute("aria-hidden", "false");
    blackout(false);
    showLetters();
  }, blackoutStart + 700);
};

// ─── Video overlay helpers ────────────────────────────────────────────────────
let videoDismissed = false;

const dismissVideoOverlay = () => {
  if (videoDismissed) return; // guard: only dismiss once
  videoDismissed = true;

  if (videoOverlayEl) {
    videoOverlayEl.classList.add("fade-out");
    // Remove from layout after CSS fade (0.8 s)
    setTimeout(() => videoOverlayEl.classList.add("gone"), 800);
  }

  // Start merge audio IMMEDIATELY as video ends
  initMergeAudio();
  if (mergeAudioEl) {
    mergeAudioEl.currentTime = 0;
    mergeAudioEl.play().catch(() => {});
  }

  // Start countdown visuals after overlay has faded
  setTimeout(() => startCountdown(), 850);
};

// ─── Boot sequence ────────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  if (!introVideoEl) {
    // No video element – jump straight to countdown
    startCountdown();
    return;
  }

  // Listen for natural end of video
  introVideoEl.addEventListener("ended", dismissVideoOverlay, { once: true });

  // Try autoplay (works on desktop; may be blocked on mobile)
  introVideoEl
    .play()
    .then(() => {
      videoPlayScreen?.classList.add("hidden"); // hide tap-to-play overlay
    })
    .catch(() => {
      // Autoplay blocked → show the TAP TO PLAY button
      videoPlayScreen?.classList.remove("hidden");
    });
});

// Fallback tap-to-play button (mobile autoplay blocked)
videoPlayBtnEl?.addEventListener("click", () => {
  videoPlayScreen?.classList.add("hidden");
  introVideoEl
    ?.play()
    .then(() => {
      introVideoEl.addEventListener("ended", dismissVideoOverlay, { once: true });
    })
    .catch(() => dismissVideoOverlay());
});

// Skip button → dismiss immediately
videoSkipEl?.addEventListener("click", () => {
  introVideoEl?.pause();
  dismissVideoOverlay();
});

audioToggleEl?.addEventListener("click", async () => {
  await handleAudioToggle();
});
