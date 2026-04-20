# Nebula X — GitHub Pages deploy (beginner friendly)

## Folder to deploy (recommended)

Publish **the repository root** (because `index.html` is at the root and it loads `./js/*`).

That means your repo should look like:

- `index.html`
- `js/`
- (other files are fine; they won’t break Pages)

## One-time GitHub Pages setup (click-by-click)

1. Push this project to GitHub.
2. Open the repo on GitHub in your browser.
3. Click **Settings** (top bar of the repo).
4. In the left sidebar, click **Pages**.
5. Under **Build and deployment**:
   - **Source**: select **Deploy from a branch**
   - **Branch**: select `master` (or `main`, whichever your repo uses)
   - **Folder**: select `/ (root)`
6. Click **Save**.
7. Wait ~30–120 seconds. Refresh the **Settings → Pages** screen until it shows your live URL.

## Expected public URL format

If your GitHub username is `<user>` and your repo is `<repo>`, your URL will be:

- `https://<user>.github.io/<repo>/`

## How to verify it works

1. Open the Pages URL above.
2. Confirm you see the Nebula X page and visuals render (not a blank page).
3. Press `?` to confirm the help overlay appears (quick sanity check).
4. (Optional) Test mic:
   - Click to start audio / enable mic in the UI
   - You should get a browser permission prompt
   - Mic works on GitHub Pages because it’s HTTPS

## Common trip-ups (read this if it “doesn’t work”)

- **Wrong folder published**: Pages must be `/ (root)` for this repo layout (because `index.html` is at the root).
- **Wrong branch**: Make sure Pages is pointing at the branch you pushed (`master` vs `main`).
- **Hard refresh** after updates: use Ctrl+F5 (browser cache can make it look like nothing changed).
- **404 on assets**: if `js/` didn’t get pushed, `index.html` will load but visuals will fail.
- **CDN dependency**: Nebula X loads Three.js from cdnjs. If that CDN is blocked on a network, the app won’t start.

