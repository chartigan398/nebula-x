# Nebula X Full Blueprint Checklist

This file is the authoritative build checklist for Nebula X.  
No shortcuts. Follow this in order, validate each stage, and only then advance.

---

## 0) Product Mission (Do Not Drift)

- [x] Build an original **audio-visual instrument**, not a template visualizer. *(see `README.md`)*
- [x] Positioning: **"I make music you watch as well as hear."**
- [x] First 10 seconds must clearly show reactive identity:
  - [x] Continuous living particle flow
  - [x] Audible event -> visible state change
  - [x] Immediate emotional signature
- [x] Prioritize long-form quality (study/sleep/ambient), not short flashy loops.

---

## 1) Architecture Shift (Stateful System)

### 1.1 Required modules
- [x] `AudioCore` (feature extraction + normalization) — `js/audio-core.js` + main loop
- [x] `SimulationCore` (forces, state, envelopes) — `js/simulation-core.js` (`updateParticleFrame`)
- [x] `RenderCore` (scene, points, material, buffers) — `js/render-core.js` (`initParticleScene`, `resize`, `disposeParticleResources`)
- [x] `NarrativeStateMachine` (scene transitions over long time) — in `index.html` (timeline helpers)
- [x] `StabilityMonitor` (runtime health) — `js/stability-monitor.js`

### 1.2 Rules
- [x] Never couple raw audio directly to camera/simulation speed.
- [x] Never add a visual mapping without telemetry visibility.
- [x] Keep simulation deterministic and bounded.

---

## 2) GPU Roadmap (Performance Foundation)

### 2.1 Current (WebGL bridge phase)
- [x] Keep CPU implementation stable and modular.
- [x] Maintain fixed-size typed arrays and avoid per-frame allocations. *(FFT buffers reused; sparklines fixed `Float32Array`)*

### 2.2 Migration target (WebGPU/GPGPU)
- [x] Design persistent GPU buffers: *(see `docs/GPU_ROADMAP.md`)*
  - [x] Position
  - [x] Velocity
  - [x] Life/Age
  - [x] Original/Base position
- [x] Define compute pass update contract:
  - [x] `position <- position + velocity`
  - [x] `velocity <- flow + spring + audioForces + damping`
- [x] Plan TSL/WGSL node pipeline for parity with WebGL behavior.
- [x] **Shipped:** WebGL **vertex shader** particle sim (`js/gpu-points-material.js`) — **opt-in** (CPU default); full WebGPU compute optional next.

---

## 3) Audio Intelligence (MIR-Oriented)

### 3.1 Live features (must exist)
- [x] raw bands: bass/mid/high
- [x] normalized bands: bassNorm/midNorm/highNorm
- [x] RMS
- [x] onset proxy (flux-like)
- [x] centroid
- [x] rolloff85
- [x] autoGain

### 3.2 Still required
- [x] spectral flatness proxy
- [x] perceptual spread proxy
- [x] soft-attack onset path for ambient pads (phase/magnitude aware behavior)
- [x] dual-timescale smoothing profiles:
  - [x] focus profile
  - [x] sleep profile

### 3.3 Validation
- [x] Debug panel toggle (`D`)
- [x] Add feature history mini sparkline (short trailing values) — buffers in AudioCore (UI graph next)
- [x] Add audio health flags (stuck input / clipped input / silent input)

---

## 4) Motion System (Shoal + Magnet + Pulse)

### 4.1 Always-on base flow
- [x] Flow field evolves continuously over time (no visible short repeat).
- [x] Use bounded acceleration and damping.
- [x] Maintain form coherence via spring attractor to base structure.

### 4.2 Music-reactive behavior
- [x] Low-end event -> outward bloom (bounded)
- [x] Post-event -> stronger re-form magnet pull
- [x] Mid/pad energy -> sustained flow strength and morph authority
- [x] Highs -> micro shimmer only (no jitter fatigue)

### 4.3 Anti-lurch constraints
- [x] No direct beat-to-camera position/speed jumps
- [x] No unbounded impulse stacking
- [x] Envelope-driven transitions only (attack/release shaped)
- [x] Per-frame displacement caps for unstable forces

---

## 5) Neuro-Aesthetic Modes (Audience State)

### 5.1 Focus / Study mode
- [x] Slightly brighter, cooler highlights
- [x] Higher detail cadence
- [x] Alpha/high-alpha supportive pulse envelope

### 5.2 Sleep / Deep calm mode
- [x] Warm circadian-safe palette bias
- [x] Lower velocity variance
- [x] Slower entrainment downshift profile

### 5.3 Shared guardrails
- [x] Avoid nervous flicker
- [x] Avoid excessive high-frequency flashing
- [x] Keep visual breathing intentional

---

## 6) Palette Engine (Brand Identity)

### 6.1 Required palettes
- [x] Cyberpunk core: hot pink / electric orange / acid yellow
- [x] Reactor core: deep crimson / burnt orange / gold
- [x] Sleep-safe warm set (amber/red weighted)

### 6.2 Behavior
- [x] Spatial delayed color ripple/patterning
- [x] Long-form palette arcs (minutes-scale) with zero lurch
- [x] Palette lock per render session (for channel consistency)

---

## 7) Narrative State Machine (Long-Form Non-Repetition)

### 7.1 Scene set
- [x] The Void
- [x] The Current
- [x] The Ember
- [x] The Aurora

### 7.2 Transition logic
- [x] Crossfade uniforms only (no hard switches)
- [x] Transition durations >= 30s
- [x] Trigger by timeline + feature conditions (not random cuts) — v0: wall-clock timeline + mild mid-band time nudge when audio on

---

## 8) Stability and Runtime Safety (1-12h)

- [x] Explicit disposal coverage for:
  - [x] geometry
  - [x] material
  - [x] textures
  - [x] media nodes/listeners
- [x] Runtime monitor:
  - [x] draw calls (estimate hook)
  - [x] texture count (manual: 1 star texture)
  - [x] memory trend (Chrome `performance.memory` when available)
  - [x] context lost handler
- [x] Optional idle throttling mode for overnight sessions

---

## 9) Creator Workflow (Production-Ready)

- [x] Preset packs:
  - [x] Sleep 60m
  - [x] Study 60m
  - [x] Dystopia 60m
- [x] Session metadata log (track, mode, key params, timestamp) — `localStorage` via `CreatorPresets.logSession`
- [x] Record flow remains one-pass:
  - [x] load file
  - [x] fullscreen
  - [x] hide HUD
  - [x] record
  - [x] export

---

## 10) Cursor Working Protocol (Mandatory)

- [x] Implement one focused change per step.
- [x] User validates every few steps. *(recommended practice)*
- [x] If regression appears, rollback to last known-good baseline first.
- [x] Update this checklist after each meaningful phase.
- [x] Do not continue when telemetry contradicts expected behavior.
