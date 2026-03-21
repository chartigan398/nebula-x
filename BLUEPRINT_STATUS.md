# Nebula X — Blueprint vs build (plain English)

`NEBULA_X_BLUEPRINT.md` is the **full** roadmap — checklist is **current** for the modular `js/` build.

## Stack (now)

| Area | Where it lives |
|------|----------------|
| Audio MIR + health + sparkline buffers | `js/audio-core.js` + `index.html` `computeAudioBands` |
| Particle sim (CPU) | `js/simulation-core.js` |
| Particle sim (GPU, optional) | `js/gpu-points-material.js` (vertex shader) |
| Scene / buffers / star texture | `js/render-core.js` |
| Stability / memory hint | `js/stability-monitor.js` |
| Creator packs + **session log** | `js/creator-presets.js` — **Export session log** button in panel |
| Orchestration, audio graph, narrative, UI | `index.html` |

## What you can **see**

| Control | Effect |
|---------|--------|
| **M** | Focus vs Sleep — fog, canvas grade, motion caps |
| **P** | Palette: spectrum → reactor → sleep |
| **GPU particles** (checkbox + reload) | Off = **CPU** sim (default). On = vertex GPU path if compile succeeds. |
| **A** | Mic / file audio → bloom & re-form bars |
| **D** | Debug numbers + telemetry map |
| **Export session log** | Downloads `localStorage` session log as JSON (§9) |
| **Particle load** | Lite 40k / Standard 100k / Beast 200k — **reload** to apply |
| **Save / Load profile** | Full slider + mode + palette + tier + preset (`user-profile.js`) |
| **`?`** | Shortcut help overlay |

## Still future / research

- **WebGPU compute** (WGSL) for particles — see `docs/GPU_ROADMAP.md`
- Optional **thin** `nebula-app.js` to shrink `index.html`

## Ship checklist (v6)

- [x] Fixed camera; particles-only motion (no user zoom / no orbit)
- [x] Help (`?`) + footer match behavior
- [x] `VERSION.md` + `README.md` aligned with stack

Rollback to last good git commit if a regression appears.
