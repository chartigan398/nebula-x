# Nebula X — Architecture (blueprint §1)

## Modules

| Module | Responsibility |
|--------|------------------|
| `js/audio-core.js` | MIR helpers: flatness, spread, sparkline buffers, health |
| `js/simulation-core.js` | Particle forces, colors, caps — **no raw FFT** in positions |
| `js/render-core.js` | Three.js scene, buffers, resize, dispose |
| `js/stability-monitor.js` | Frame tick, memory hint, context loss |
| `js/creator-presets.js` | Packs + session log |
| `index.html` | Audio graph, envelopes, narrative, UI, `animate` |

## §1.2 Rules (enforced in design)

1. **Never couple raw audio to camera / base simulation clock**  
   - `time` / flow clock advance from **`morphSpeed`** and wall clock, not from band levels. The **camera is fixed** (no orbit); only particles move.  
   - **Exception (documented):** narrative clock gets a **mild** multiplier `1 + 0.048 * midNorm` when audio is on — still uses **slow** `midNorm`, not instantaneous bins.

2. **Never add a visual mapping without telemetry visibility**  
   - Bloom / re-form: on-screen bars + **D** panel.  
   - Sparklines: bass / mid / flatness history in the control panel.  
   - Debug lists **which envelopes** drive morph, flow, and pulse.

3. **Keep simulation deterministic and bounded**  
   - Session seed + phase offsets; per-frame displacement caps; flow vector caps; `maxStrayFromTarget`, `maxBloomPush`, `maxShimmerUnits`.

## FFT / allocations (§2.1)

- Frequency-domain work reuses **`fftByteFrequency`** and **`timeDomainData`** buffers sized to the analyser — no `new Uint8Array` per frame on the hot path once allocated.
