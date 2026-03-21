# Nebula X — module layout (blueprint §1)

| File | Role |
|------|------|
| `js/nebula-namespace.js` | `window.NebulaX` root |
| `js/audio-core.js` | Spectral flatness, spread, sparkline buffers, health tracker |
| `js/stability-monitor.js` | WebGL context loss, frame tick, memory hint |
| `js/creator-presets.js` | Sleep / Study / Dystopia packs + session log |
| `js/user-profile.js` | Beast profile save/load (params, tier, modes) → `localStorage` |
| `js/render-core.js` | Scene, camera, renderer, particle geometry + buffers, **dual Points** (core + halo), star texture, resize, dispose |
| `js/simulation-core.js` | Per-frame particle forces, colour, bloom/reform mapping (CPU) |
| `js/gpu-points-material.js` | GPU vertex shader path — same forces/colour math; default on |
| `index.html` | App shell: audio, narrative timeline, UI, animate orchestration, recording |

**Docs:** `README.md` (product line), `ARCHITECTURE.md` (§1.2), `docs/GPU_ROADMAP.md` (§2.2).

**Next:** optional `narrative-state-machine.js`; thin `nebula-app.js` to shrink `index.html` further; WebGPU compute (see `docs/GPU_ROADMAP.md`).

**Creator:** **Export session log (JSON)** in the control panel downloads `CreatorPresets.readLog()` (record/pack events).

**Run:** Open `index.html` in a browser (relative `script src` loads `js/`). For strict environments, serve the folder (e.g. `npx serve`).
