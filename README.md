# Nebula X

**Audio-visual instrument** — *“I make music you watch as well as hear.”*

Not a template visualizer: long-form, study/sleep/ambient first; reactive identity in the first seconds comes from **continuous particle flow**, **envelope-driven** audio→motion (bloom / re-form / morph), and mode+palette intent (Focus / Sleep, spectrum / reactor / sleep palettes).

## Run

Open `index.html` in a browser, or serve the folder (e.g. `npx serve`) for mic/file audio.

### The Titan (WebGPU greenfield)

Separate project folder: **`The Titan/`** — Vite + `three/webgpu`, aimed at compute + curl noise + million-particle path. `cd "The Titan"` → `npm install` → `npm run dev` (see **`The Titan/README.md`**).

**v6:** The **camera is fixed** — you’re not flying through the scene; **particles** carry the motion (see help overlay **`?`**).

**Expression** slider (panel): turns up **shape morph speed**, **spectral-centroid colour drift**, **flatness→flow chaos**, **spread→looser clouds**, and **grade punch** with audio.

**Look:** **two draw layers** — crisp points + a **soft additive halo** (grows on bloom/onset). Whole-cloud “zoom” breathing was **removed**; hits should read as **light + expansion in the field**, not the camera pumping in/out.

## Docs

| File | Purpose |
|------|---------|
| `NEBULA_X_BLUEPRINT.md` | Full build checklist |
| `ARCHITECTURE.md` | Module boundaries + telemetry rules (§1.2) |
| `docs/GPU_ROADMAP.md` | WebGPU/GPGPU migration notes (§2.2) |
| `MODULES.md` | `js/*` layout |

**GPU particles:** optional **vertex shader** sim (`js/gpu-points-material.js`). **CPU** (`simulation-core.js`) is the default — check **GPU particles** + reload to try the GPU path. If anything looks wrong, leave it off.

**Session log:** **Export session log (JSON)** in the panel saves creator/recording events from `localStorage` (blueprint §9).

**Beast mode:** **Particle load** — Lite (40k) / Standard (100k) / Beast (200k), reload to apply. **Save profile** / **Load profile** stores sliders + tier + modes in `localStorage` (`js/user-profile.js`). **`?`** opens the shortcut help overlay.

## Controls (short)

Mouse = warp · **A** audio · **P** palette · **M** mode · **N** narrative · **D** debug + sparkline numbers · **H** HUD · **R** record
