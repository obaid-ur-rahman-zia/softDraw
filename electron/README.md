# SoftDraw Screen Pen (desktop)

An Epic Pen-style transparent overlay that lets you draw over **anything on your
screen**. It's a thin Electron shell that loads SoftDraw's `/screen` annotator in
a click-through, always-on-top window.

## Controls

| Shortcut | Action |
| --- | --- |
| `Ctrl+Alt+D` | Toggle **Draw** ↔ **Pass-through** (use your desktop normally) |
| `Ctrl+Alt+C` | Clear the drawing |
| `Ctrl+Alt+Q` | Quit |

You can also right-click the tray icon for the same options. The floating toolbar
(top of screen) has colors, brush sizes, a highlighter, undo and clear.

## Run in development

```bash
# 1) start the web app in the repo root
npm run dev            # serves http://localhost:3000

# 2) in another terminal
cd electron
npm install
npm run dev            # loads http://localhost:3000/screen
```

## Build a Windows installer (.exe)

```bash
cd electron
npm install
npm run build:win
```

The installer + portable `.exe` are written to `electron/dist/`. Upload them to a
GitHub Release (tag `desktop-vX.Y.Z`) so the in-app **/download** page can link to
them. macOS/Linux: `npm run build:mac` / `npm run build:linux`.

> The overlay loads `https://softdraw.site/screen` by default. Set `SCREEN_URL`
> to point at a different deployment.
