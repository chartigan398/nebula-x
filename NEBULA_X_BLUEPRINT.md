# Nebula X Blueprint (Mission Anchor)

This file is the always-on mission reference for Nebula X work sessions.
Read this before implementing new behavior.

## Core Mission

Build an original audio-visual instrument, not a generic visualizer:

- Original reactive music compositions + living particle visuals
- "Music you watch as well as hear"
- First 10 seconds must clearly show reactive identity

## Technical Direction

1. Move from ad-hoc effects to a stateful architecture
2. Keep simulation stable for long-form sessions (1-12h)
3. Use normalized audio features, not raw spikes
4. Build toward WebGPU/GPGPU migration after behavior is correct

## Current Phased Plan

### Phase 1 - Audio Core (must stay reliable)

- Maintain these live features:
  - raw bands: bass, mid, high
  - normalized bands: bassNorm, midNorm, highNorm
  - rms energy
  - onset (flux-like)
  - centroid and rolloff85
  - autoGain
- Keep debug telemetry toggle (`D`) for validation.
- Never map new visuals without checking debug values first.

### Phase 2 - Motion Behavior

- Flow field should be smooth and continuous.
- Magnet cohesion + bloom should be driven by normalized low-end features.
- Avoid beat-snappy lurching.
- One small movement change per iteration, then test.

### Phase 3 - Palette Behavior

- Palette is part of brand identity.
- Primary style:
  - Cyberpunk: hot pink, electric orange, acid yellow
- Alternate style:
  - Reactor core: deep crimson, burnt orange, gold
- Keep spatial color delay/ripple for patterned transitions.

### Phase 4 - Long-Form Stability

- Prioritize non-repetitive evolution over flashy short loops.
- Ensure no runaway forces, no drift explosions, no frame stalls.
- Dispose resources explicitly and keep frame behavior stable.

## Creative/Neuro-Aesthetic Guardrails

- Avoid nervous jitter in sleep/study contexts.
- Keep motion intentional: drift, expand, reform.
- Use smoothing and envelopes for all reactive events.
- Warm palettes for calmer content; cool/high-energy only when intended.

## Workflow Rules

- Implement one step at a time.
- User tests every few steps before proceeding.
- If behavior regresses, revert to known-good baseline and continue.
- Keep this file updated when the strategy changes.
