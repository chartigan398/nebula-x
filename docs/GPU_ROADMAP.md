# WebGPU / GPGPU roadmap (blueprint §2.2)

Design-only document for migrating the CPU particle loop to **compute** while keeping the same *feel* as `simulation-core.js`.

## Persistent GPU buffers (per particle)

| Buffer | Contents | Notes |
|--------|----------|--------|
| `positions` | `vec3` world position | Same role as `geometry.attributes.position` |
| `velocities` | `vec3` | Introduced explicitly (implicit on CPU today) |
| `baseTarget` | `vec3` | Morph lerp target (cloud→ring→sphere) |
| `aux` | `vec4` | e.g. `phase`, hue delay seed, size base |
| `lifeAge` | optional `f32` | Reserved for future life-cycle / streaks |

## Compute pass update contract (per frame)

1. **Sample audio features on CPU** (or upload a small **uniform struct** once per frame: `bloomEnv`, `reformMagnet`, `midNorm`, `onset`, mode caps).

2. **For each particle index `i`:**
   - `target = lerp morph(baseTarget[i])` (same algebra as CPU).
   - `accel = flowField(pos, time) + magnet(pos, cursor) + spring(pos - target) + audioRadial(bloom)`.
   - `velocity[i] = velocity[i] * damping + accel * dt` (clamp magnitude).
   - `position[i] += velocity[i] * dt` (then apply same **stray cap** as CPU).

3. **Color**  
   - Either compute HSL in WGSL from `pos`, `phase`, palette uniforms **or** keep a simplified shader that reads a **palette texture** + narrative hue shift.

## Parity checklist

- [ ] Same caps: `maxStrayFromTarget`, flow cap, bloom push cap, shimmer cap.
- [ ] Same envelopes: no raw FFT → position; only uploaded scalars.
- [ ] Deterministic: pass `sessionSeed` + time as uniforms.

## TSL / WGSL nodes (future)

- Express **flow field** and **magnet falloff** as node graphs for iteration in Three.js WebGPU mode; compile to WGSL compute or vertex shader path.

## References

- Current CPU reference: `js/simulation-core.js` (`updateParticleFrame`).
- **Shipped GPU path (WebGL):** `js/gpu-points-material.js` — vertex shader parity with `simulation-core.js` (morph, magnet, flow, bloom, HSL, point size). Toggle in UI; CPU fallback.
- Bridge phase: `NEBULA_X_BLUEPRINT.md` §2.1 (fixed arrays, no hot-path alloc).
