# Nebula X — Full Report (StardustV1)

Generated from inspection of `index.html`, `js/*`, and project docs. **Blunt assessment:** this is a strong solo-dev creative build with real documentation discipline. It is not a commercial product in a box; it is shippable as a **tool + portfolio piece** if you stop adding scope.

---

## SECTION 1 — What the product is

### What Nebula X is

**Nebula X** is a **browser-based audio–visual instrument**: a large field of particles (up to hundreds of thousands) that **morph** between cloud / ring / sphere shapes, **react to audio** (mic or file) through analyzed bands and derived “MIR-style” features, and render with a **fixed camera** so motion reads from **particles and light**, not from flying the viewpoint. It uses **Three.js** (WebGL), optional **GPU vertex** simulation path, and a **dual-layer** draw (sharp points + soft additive halo).

A **separate** subproject **`The Titan/`** (Vite, WebGL2/GPU sim experiments) lives in the same repo but is **not** Nebula X proper — do not mix “finishing Nebula” with “finishing The Titan.”

### Who it could be for

- **You**, as a **personal ambient / focus** visual while working or listening.
- **Creators** who want **background visuals** for streams or clips (with screen recording or built-in `.webm` capture).
- **Music listeners** who want **synesthetic-ish** feedback that is calmer than a nightclub visualizer.
- **Developers / artists** using it as a **portfolio artifact** (“I build real-time A/V systems”).

It is **not** aimed at casual mobile users expecting App Store polish, and it is **not** a social or multiplayer product.

### Why someone would use it

- **Long-session behavior** is explicitly designed (focus vs sleep modes, narrative timeline, palette arcs) — not just a short looping demo.
- **Telemetry** (debug panel, bloom/re-form bars, health hints) makes the system **legible** when tuning — rare for a one-person WebGL toy.
- **Export paths exist**: canvas **recording to WebM**, **session JSON log** for creator workflow — enough to integrate into a real pipeline if you care.

---

## SECTION 2 — Current features

### Visuals

- Full-screen **WebGL** canvas; **exp2 fog** tuned per experience mode.
- **Fixed camera** (no orbit, no user zoom) — v6 design choice; motion is **particle-driven**.
- **Two draw layers**: crisp **Points** + larger **additive halo** (`render-core.js`) for bloom/onset reads as **light in the field**, not camera pump.

### Particle behavior

- **CPU simulation** (`simulation-core.js`) — **default**, most predictable.
- **Optional GPU vertex path** (`gpu-points-material.js`) — checkbox + **reload**; same conceptual forces; fallback if init fails.
- **Morph** between **cloud → ring → sphere** targets (lerped targets per particle).
- **Mouse warp / gravity** interaction (documented as primary interaction).
- **Particle tiers**: Lite (~40k) / Standard (~100k) / Beast (~200k) — **requires reload** when changed (stored in `localStorage`).
- **Flow drift** and **time** evolution decoupled from raw audio lurch (smooth ambient motion).

### Beat / dynamics reaction

- FFT-style **bass / mid / high** normalization.
- **Bloom envelope** (attack/release) for transient “hits” — UI bar + particle push.
- **Re-form** bar (second transient channel in UI) tied into motion reshaping.
- **Bass impulse**, **pulse energy**, and band levels feed morph and size.
- **Narrative timeline** (`sampleNarrative`) — long-form **segments** with crossfades when narrative enabled; time can get a **mild mid-driven multiplier** when audio on.

### Colour systems

- **Palette modes**: `spectrum` → `reactor` → `sleep` (keyboard **P** cycles).
- **Segmented palette timelines** with smooth lerps (`PALETTE_*_SEGMENTS`, arc multiplier for slower index motion).
- **Centroid-driven hue drift** (brightness of spectrum influences global hue).
- **Experience modes** `focus` vs `sleep` (**M**) adjust fog, morph biases, bloom gains, flow, saturation/lighting offsets (`MODE_PROFILES`).

### Audio features

- **Mic** or **file** input (**A** / panel); Web Audio **AnalyserNode** path.
- **MIR-oriented helpers** (`audio-core.js`): spectral **flatness**, **perceptual spread**, **sparkline** buffers (fixed allocation).
- **Health tracker**: silent input, clipping, “stuck spectrum” flags for debugging long sessions.
- **Auto-gain / smoothing** behavior in the main loop (see `computeAudioBands` in `index.html`).

### Recording / export

- **Canvas `captureStream`** + **`MediaRecorder`** → **`.webm`** download (VP9/VP8 preferred codecs).
- If audio graph exposes **`audioMixDestination.stream`**, **one audio track** is **muxed** into the `MediaStream` with the canvas video track.
- **1s `timeslice`** chunks to limit memory growth on long recordings.
- **HUD auto-hidden** when recording starts so chrome does not appear in the file.
- **Session log** (`creator-presets.js`): capped **JSON log** in `localStorage`, **Export session log** button downloads events (e.g. record start/stop with params).

### Controls / settings

Documented shortcuts (from README / help overlay):

| Input | Role |
|------|------|
| Mouse | Warp / gravity |
| **A** | Audio panel / graph |
| **P** | Palette cycle |
| **M** | Focus ↔ Sleep |
| **N** | Narrative on/off |
| **D** | Debug + sparkline numbers |
| **H** | HUD visibility |
| **R** | Record / stop (with buttons) |
| **F** | Fullscreen |
| **C** | Clock (per footer) |
| **?** | Help overlay |

- Sliders: **morph speed**, **Expression** (drives shape/color/flow strength bundle), **color speed**, flow/gravity strengths (context-dependent).
- **Creator packs** dropdown: Sleep 60m / Study 60m / Dystopia 60m — applies preset params + modes and can reload profile.
- **Save / Load profile** (`user-profile.js`): beast profile in `localStorage` (versioned payload).

### Performance options

- **GPU particles** toggle (off by default in UI copy — **CPU default**).
- **Particle tier** selection (Lite / Standard / Beast).
- **Tab hidden** throttling in `animate` (reduces work when backgrounded).
- **`devicePixelRatio` capped at 2** in renderer setup.
- **StabilityMonitor**: FPS estimate, memory hint (where `performance.memory` exists), WebGL context loss listeners.

### Anything else

- **Preset narrative** title/sub/bar UI (`narrative-panel`).
- **Blueprint / architecture docs** in repo (`NEBULA_X_BLUEPRINT.md`, `ARCHITECTURE.md`, `MODULES.md`, `docs/GPU_ROADMAP.md`).
- **VERSION.md** history with git fallbacks for older builds.

---

## SECTION 3 — Current quality level

**Rating: near finished, with “finished but unpolished” edges.**

| Axis | Assessment |
|------|------------|
| **Core loop** | Strong — modes, palettes, audio, sim separation are coherent. |
| **Docs vs code** | Unusually good for a personal project; checklists in `BLUEPRINT_STATUS` match the modular layout. |
| **Production readiness** | **No** — no automated tests, browser matrix not proven here, `index.html` is a **monolith** (~1500+ lines), recording depends on **browser codec** support. |
| **Polish** | Functional UI; not product-design-system polished. |

**One-line truth:** It behaves like a **late beta / candidate release** for a niche creative tool: feature-complete for its intent, not enterprise-hardened.

---

## SECTION 4 — What is broken / weak / messy

### Architecture / maintainability

- **`index.html` does too much**: audio graph, narrative, animation loop, recording, keyboard — hard to refactor without discipline. Docs already admit a future thin `nebula-app.js` is optional, not done.
- **`MODULES.md` line about GPU “default on” conflicts** with UI/docs (**CPU default**). That is a **documentation bug**, not necessarily a code bug.

### Browser / environment

- **`file://`**: many browsers restrict mic / certain APIs — **serving the folder** (`npx serve`) is the reliable path; README already says so, but users will still double-click and complain.
- **Safari / iOS**: WebM + `MediaRecorder` behavior is historically weaker than Chromium; **do not promise** parity without testing.
- **Recording without audio**: mux path only adds audio if `audioMixDestination` exposes a track — **silent video** is a valid outcome if audio not wired; may confuse users expecting system audio capture (not implemented).

### UX / clarity

- **Particle tier + GPU checkbox require reload** — correct for implementation, **easy to forget**; easy to think something is “broken” when it needs refresh.
- **Context restore** logs “reload recommended” — **no automatic rebuild** of WebGL scene after loss.
- **Help overlay** is good, but the **control surface is dense** for first-time users.

### Code health

- Lots of **silent `catch {}`** — fine for resilience, bad for diagnosing user-reported failures in the field.
- **No automated regression tests** — acceptable for art tool, not for “production SaaS.”

### The Titan

- Not “broken” — **scope risk**. Treat as **R&D** so it does not block Nebula X shipping.

---

## SECTION 5 — What finishing actually means (realistic v1)

**Definition of v1:** “I can hand someone a URL or zip, they can run it in Chrome/Edge, get stable visuals + optional audio, and export a clip or JSON log without me apologizing.”

### Polish items

- [ ] **One pass** on copy: footer, help overlay, and `recordStatus` strings — no contradictions.
- [ ] **Fix doc inconsistency** (`MODULES.md` GPU default line).
- [ ] **Tagged git release** (`VERSION.md` currently has “set when tagged” placeholder).

### UI cleanup

- [ ] **Confirm** tier/GPU/reload hints are visible where users change those settings (not buried).
- [ ] **Optional**: one-line “Recommended: Chrome/Edge, serve locally” near Run instructions (README already partially does this).

### Performance fixes (only if measured)

- [ ] Run **Standard** tier on target machine; if FPS unstable, **lower default tier** in docs, not a rewrite.
- [ ] **Beast** mode: label as experimental in README if laptops choke.

### Stability fixes

- [ ] **Smoke test** WebGL context loss path (hard to force; at least document “reload on restore”).
- [ ] **Long recording** (5–10 min) — watch for memory / tab crash on your hardware.

### Export improvements

- [ ] **Document** WebM codec expectations and that **Safari may differ**.
- [ ] **Optional**: note filename pattern / where download lands (browser download folder).

### Onboarding / help

- [ ] **Help overlay** (`?`) matches every key listed in README (spot-check once).
- [ ] **First-run**: user gesture for audioContext.resume — already partially handled; verify cold start.

### Packaging

- [ ] **Zip** with `index.html` + `js/` + assets; verify **relative paths** work.
- [ ] **Static host** (GitHub Pages, Netlify, etc.): confirm **HTTPS** for mic if you care about mic in production.
- [ ] **Optional**: one **screenshot or short GIF** for README — not code, but affects perceived “done.”

**Explicit non-goals for v1**

- Full **WebGPU compute** migration (`docs/GPU_ROADMAP.md` — research track).
- Splitting `index.html` into modules — **nice**, not required to ship v1.
- Mobile-first UI — only if you explicitly want that scope later.

---

## SECTION 6 — Monetization reality

| Direction | Realistic? | Notes |
|-----------|------------|------|
| **Free art toy** | **Yes** | Easiest honest position. |
| **Paid visualizer** (one-time) | **Maybe** | Gumroad / itch: only if you package **presets + clear run guide + demo clip**. Audience is small. |
| **Creator tool** (stream / video B-roll) | **Maybe** | You must market to creators; competition is heavy (OBS plugins, VJ software). Your edge is **browser + no install** and **long-session** design. |
| **Screensaver** | **Weak fit** | Browsers are not screensavers; would need wrapper app — new product. |
| **Stream background** | **Plausible** | Capture window or use built-in record; quality depends on GPU and bitrate — set expectations. |
| **Music artist tool** | **Plausible as niche** | Useful for **loops / ambient** acts more than EDM peak-time strobing. |
| **SaaS / subscription** | **Poor fit** | No account system here; GPU-heavy client work does not naturally become recurring revenue without a **new** business layer. |

**Bottom line:** Treat money as **optional upside**, not the reason to finish v1.

---

## SECTION 7 — Final recommendation

### Should you finish and launch?

**Finish:** **Yes**, if “launch” means **tag a version, publish README + artifact, maybe itch/Gumroad or a demo URL** — the work matches that bar.

**Launch as a business:** **Only** if you accept **marketing and support** as the real job; the code is not the bottleneck.

### Should you finish and keep personal use?

**Valid.** If you only want **reliable beauty + recording for your own pipeline**, do the **v1 checklist** and stop — no shame.

### Pause?

**Pause** if you are tempted to start **The Titan** merge or **WebGPU compute** before v1 is tagged. That is how this stays 90% forever.

### Rebuild later?

**No need** for a ground-up rewrite unless you hate Three.js or need a native app. The architecture is **honest**; what you need is **release discipline**, not a new framework.

---

**Final verdict:** **Finish v1 as a shippable creative tool, tag it, use it or list it — then decide monetization with real user feedback (even if N=1).** Anything else is procrastination dressed as ambition.
