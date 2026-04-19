# Nebula X v7 - Directed Flow Story Spec

This is the execution spec for the next build.  
Goal: keep the "alive" quality of flow fields while giving the visual a deliberate narrative arc.

## Core Principle

Use a **hybrid system**:

- **Story spine (deterministic):** chapter timeline + target shape attractors.
- **Surface life (emergent):** layered flow fields + per-particle inertia/noise.

Result: intentional long-form progression without looking rigid or loop-y.

## Runtime Structure

Per-frame motion is the weighted blend:

`V = wFlow * F_flow + wAttr * F_attractor + wOrbit * F_orbit + wJitter * F_micro`

Where:

- `F_flow`: curl/noise field (slowly rotating domain)
- `F_attractor`: chapter target pull toward implicit shape
- `F_orbit`: tangential orbital component around chapter center
- `F_micro`: low-amplitude high-frequency detail

And integrate with inertia:

`vel = lerp(vel, V, accel)` then `pos += vel * dt`

## Chapters (40 min loop)

Total cycle: **2400s**.  
Each chapter has a hold and a crossfade into the next.

1. **Birth Cloud** (0-600s)
   - Mood: sparse, vast, uncertain
   - Target: diffuse sphere/ellipsoid attractor
   - Field weights: flow high, attractor low
   - Palette: cold near-black with faint cyan steel

2. **Halo Formation** (600-1200s)
   - Mood: order emerging from chaos
   - Target: torus/ring attractor
   - Field weights: attractor medium-high, orbit medium
   - Palette: cyan -> pale amber accents

3. **Rose Geometry** (1200-1800s)
   - Mood: sacred/mechanical pattern intelligence
   - Target: rose-curve attractor (`r = a * cos(k*theta)` family)
   - Field weights: attractor high, flow medium
   - Palette: richer split-tone (cool body, warm edge)

4. **Apparition + Dissolve** (1800-2400s)
   - Mood: "something watching" then release
   - Target: soft face-probability mask (not explicit face)
   - Field weights: attractor pulse bursts, then decay back to flow
   - Palette: desaturated violet-gray -> collapse to black/cyan

Loop transition: dissolve density and coherence over last ~90s into Chapter 1.

## Transition Rules

- Crossfade window between chapters: **60s** minimum.
- Never hard-switch target field.
- During crossfade, blend both attractors and both palettes.
- Clamp global speed changes to <= 15% over any 10s window.

## Attractors (Implicit, Not Mesh Morphs)

Use signed-distance-like pull fields, not hard geometry snaps.

- **Cloud:** pull to broad ellipsoid shell with low stiffness.
- **Halo:** pull to torus band (`sqrt(x^2+y^2)-R`, z thickness).
- **Rose:** pull to polar target in projected plane + depth jitter.
- **Apparition mask:** weighted density map with low confidence (max 0.25 influence).

Attractor force:

`F_attractor = -normalize(grad(d)) * smoothstep(dMax, dMin, d) * attractorGain`

## Audio Mapping (Subtle, Not Jumpy)

- **Bass:** modulates coherence pulses (`wAttr` boost, low frequency)
- **Mid:** controls flow complexity (`wFlow` detail blend)
- **High:** controls shimmer/edge glow and micro-jitter cap

Safety:

- audio influence is additive and bounded
- no direct camera motion from audio
- no per-beat hard pulses

## Event System (Rare Directed Beats)

Max one event every 25-60s (randomized).

Event types:

- **Compression wave:** brief inward field squeeze then release
- **Axis shear:** subtle directional bias sweep across frame
- **Coherence lock:** 3-8s temporary attractor dominance

Each event has attack/hold/release envelopes. No instant edges.

## Visual Guardrails

- Keep background pure black (`#000`) always.
- Maintain depth readability: far/mid/near particle strata.
- Never let a single corner lock one hue for > 90s.
- No full-screen flashing; luminance delta capped frame-to-frame.

## Engineering Plan (Build Order)

1. Add `chapterDirector` timeline state (time -> chapter + blend).
2. Implement attractor field functions (cloud/halo/rose/apparition).
3. Add weighted field blend and inertia integrator.
4. Add bounded audio influence layer on weights.
5. Add low-frequency event envelopes.
6. Add chapter debug HUD (current chapter, blend, weights).
7. Tune constants for 20 min, then 40 min stability pass.

## Definition of Done

Ship only when all are true:

- Running 40 min, no visible hard loop seam.
- Clear perceived progression through all 4 chapters.
- "Halo" and "Rose" states are recognizable without looking static.
- Apparition reads as suggestion, not literal face drawing.
- Audio off still looks alive; audio on feels tighter, not chaotic.
- No stuck hue corner, no strobe, no dead stillness > 10s.

## v7 Control Surface (Minimal)

Expose only these live controls:

- `Story Speed` (0.5x-1.5x)
- `Attractor Strength`
- `Flow Turbulence`
- `Audio Influence`
- `Event Intensity`

Everything else stays internal to avoid tweak-loop.

