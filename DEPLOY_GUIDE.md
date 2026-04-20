# Nebula X — Deploy Guide (free + simplest)

Nebula X is a static site: **ship `index.html` + `js/`**.

## Recommended: GitHub Pages (free, easiest if you already use GitHub)

1. Create a GitHub repo for Nebula X (or use the existing one).
2. Push this folder to GitHub.
3. In GitHub: **Settings → Pages**
4. **Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: `master` (or `main`)
   - Folder: `/ (root)`
5. Wait for Pages to publish, then open your Pages URL.

Why this is the best default:

- **HTTPS by default** (needed for microphone input on a public URL)
- Zero build step
- Works perfectly for `index.html` + relative `js/` imports

## Fast alternative: Netlify Drop (free, no config)

1. Build the release zip (or use the `release/NebulaX-v6/` folder).
2. Go to Netlify and use **“Deploy manually”** / drag-and-drop.
3. Drop the **folder contents** (or unzip first, then drop).

## Notes (so you don’t get surprised)

- **Microphone requires HTTPS** on a public site (GitHub Pages provides this).
- Nebula X currently loads **Three.js from cdnjs**:
  - `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`
  - If a network blocks cdnjs, the app won’t start. (For this week: just be aware and mention it in release notes if needed.)

