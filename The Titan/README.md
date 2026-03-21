# The Titan

Greenfield visual engine — separate from Nebula X (`../index.html`).

## Run

```bash
cd "The Titan"
npm install
npm run dev
```

Open **http://localhost:5174/** (Vite).

## Implemented (in order)

1. **Polish** — Play / Pause, volume, seek (after file load), **Bass / Mid / High gain** + **Envelope speed** sliders. Same tuning via URL (see below). **`?lite=1`** lowers default particle count.
2. **Phase B — GPU texture sim** — **`?sim=gpu`** uses `GPUComputationRenderer` (WebGL2 float RT ping‑pong: position + velocity, curl-like force, mouse in sim). **No per-frame CPU particle loop** for that path. Falls back to vertex if unsupported. **Native WebGPU WGSL compute** is the next migration (same folder, future file).
3. **Director** — Slow **A↔B** blend of curl field character over **`?act=seconds`** full cycle (default 180s one way; triangle wave so it returns). Drives `uDirectorBlend` (vertex) and `uCurlF` / `uCurlG` (GPU sim).
4. **Bloom** — `UnrealBloomPass` via `EffectComposer`. Disable with **`?bloom=0`**. Tune: `bloomstr`, `bloomrad`, `bloomthr`.

## File-only audio

No mic. **Load audio file** → Web Audio **AnalyserNode** → mids → flow, bass → magnet + pulse, highs → size, centroid → hue bias. GPU sim path maps mids/bass into `uFlowScale` / `uMagnetStrength`.

## URL parameters

| Param | Meaning |
|--------|---------|
| `n` | Particle count (vertex mode), e.g. `n=120000` |
| `lite=1` | Lighter default count (~72k vertex; smaller GPU grid target) |
| `bass` `mid` `high` | Gain multipliers (default 1) |
| `smooth` | Envelope follow speed (default 8) |
| `aft` | Analyser smoothing 0.1–0.99 (default 0.65) |
| `sim=gpu` | GPU texture simulation |
| `sim=vertex` | High-count vertex shader (default) |
| `bloom=0` | Off |
| `bloomstr` `bloomrad` `bloomthr` | Bloom tuning |
| `act` | Director half-cycle length in seconds (default 180) |

Example: `?lite=1&sim=gpu&act=120&bass=1.2&mid=0.9`

## Stack notes

- **three** r173 + Vite.
- Postprocessing imports: `three/examples/jsm/postprocessing/…`
- GPU sim: `three/examples/jsm/misc/GPUComputationRenderer.js`

---

*Sibling: `../` Nebula X / Stardust.*
