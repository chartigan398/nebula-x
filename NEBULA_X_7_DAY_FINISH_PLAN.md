# Nebula X — 7-Day Finish Plan

**Goal:** Ship **v1** as defined in `NEBULA_X_FULL_REPORT.md` (Section 5). **Not** new features. **Not** The Titan merge. **Not** WebGPU compute.

**Rules:** One browser family first (**Chrome or Edge**). Serve locally (`npx serve` or equivalent). Document failures instead of coding around every edge case in week one.

---

## Day 1 — Baseline proof (no code unless blocking)

**Morning (2–3 h)**

- [ ] Fresh clone or copy of folder — open **`index.html` via local server** (not `file://`).
- [ ] Run **CPU path only** (GPU checkbox **off**). Tier **Standard**.
- [ ] Walk every shortcut in help **`?`**: **A P M N D H R F C** — note anything that lies vs reality.
- [ ] **Mic** and **file** audio both once; watch **debug D** for sensible numbers.

**Afternoon (2–3 h)**

- [ ] Toggle **GPU particles** + reload — does it run? If glitchy, **document “use CPU for v1 demo”** and move on.
- [ ] **Record** 60–90s clip with audio; play back file. If audio missing, note whether mic/file was active and whether status text was clear.

**Output:** A short **TEST_NOTES.md** (can live in repo or your graveyard folder) with **Pass / Fail** and **Won’t fix for v1** items.

---

## Day 2 — Recording + export stress

**Focus:** Long takes and JSON log — these are your “pipeline” deliverables.

- [ ] **Recording:** 5+ minute capture (same session), Standard tier, CPU. If tab dies or file corrupts, **lower tier** and retry once — record the outcome.
- [ ] **Export session log** button → open JSON → confirm events make sense (record start/stop, params).
- [ ] **Save / Load profile**: round-trip; reload page; confirm nothing silently wipes.

**Code only if:** recording fails entirely on your target browser — then **minimal** fix (e.g. status string, or guard when `captureStream` missing — already partially handled).

**Stop:** No bitrate tuning rabbit holes unless capture is unusable.

---

## Day 3 — Docs + lies cleanup

**No feature work.**

- [ ] Fix **`MODULES.md`** GPU “default” wording to match **CPU default** (and UI).
- [ ] **`VERSION.md`**: set **git tag** name when you tag (or remove placeholder line).
- [ ] **README “Run”**: one paragraph — **serve folder**, **Chrome/Edge recommended**, **`file://` mic may fail**.
- [ ] Read **`?` overlay** and **README** side by side — one pass to remove contradictions.

---

## Day 4 — Tier + reload UX (small patches only)

**Goal:** Stop “I changed tier and nothing happened” support burden.

- [ ] Where tier / GPU are changed, ensure **visible** hint: “Apply: reload page” (string tweak, not redesign).
- [ ] Optional: `beforeunload` or button is **not** worth it for v1 — **text is enough**.

**Cap:** Max **1–2 hours** of HTML/CSS copy changes unless you hit a real bug.

---

## Day 5 — Performance sanity (measure, don’t optimize blind)

- [ ] On **your** main machine: Standard + CPU — note approximate FPS from **D** panel over 2–3 minutes.
- [ ] Repeat **Beast** once. If unusable, README sentence: **“Beast: high-end GPU only.”**
- [ ] Background tab: leave running 10 minutes, tab hidden — confirm it doesn’t melt laptop (if it does, **document**, don’t rewrite scheduler).

**No:** shader rewrites, particle count algorithms, GPU compute.

---

## Day 6 — Package + publish rehearsal

- [ ] **Zip** the tree needed to run: `index.html`, `js/`, `docs/` as needed, favicon if any — **test unzip in a temp folder** and serve.
- [ ] If you use **GitHub Pages** or similar: push and verify **HTTPS** mic if that matters to you.
- [ ] **Git tag** e.g. `v1.0.0-nebula` on the commit you tested.

**Optional but high value:** One **10–20s screen recording GIF or MP4** for README (shows it’s real).

---

## Day 7 — Ship checklist + stop line

- [ ] Section 5 checklist in **NEBULA_X_FULL_REPORT.md** — mark what’s done.
- [ ] Write **CHANGELOG.md** or **release blurb** in three bullets: what it is, how to run, known limits.
- [ ] **Stop.** No “just one more” GPU roadmap work.

**If something failed all week:** you still ship **source + honest README** with “tested on X only” — that is still v1 for a personal tool.

---

## What this plan deliberately excludes

- **The Titan** — separate schedule.
- **WebGPU / WGSL compute** — research; not v1.
- **Splitting `index.html`** — refactor week, not ship week.
- **Mobile Safari polish** — only if you already committed to that product direction.

---

## Daily time budget (realistic)

| Day | Hours | Theme |
|-----|-------|--------|
| 1 | 4–6 | Proof |
| 2 | 3–5 | Record/log |
| 3 | 2–4 | Docs |
| 4 | 1–3 | Copy/UX |
| 5 | 2–3 | Perf notes |
| 6 | 3–5 | Package/tag |
| 7 | 2–3 | Release |

**Total:** ~17–29 hours — feasible as a **focused week** alongside a day job if you compress Days 5–7.

---

*Ship the tool. Tag the commit. Then decide if anyone else should pay for it.*
