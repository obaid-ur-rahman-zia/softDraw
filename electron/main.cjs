// SoftDraw desktop — an Epic Pen-style transparent screen overlay.
// It shows the web /screen annotator in a click-through, always-on-top window.
const {
  app,
  BrowserWindow,
  globalShortcut,
  Tray,
  Menu,
  nativeImage,
  screen,
} = require("electron");
const path = require("path");

// The overlay loads this page. Override with SCREEN_URL for local dev
// (e.g. http://localhost:3000/screen).
const SCREEN_URL = process.env.SCREEN_URL || "https://softdraw.site/screen";

let win = null;
let tray = null;
let drawMode = true;

function setDrawMode(on) {
  drawMode = on;
  if (win) win.setIgnoreMouseEvents(!on, { forward: true });
  if (tray) {
    tray.setToolTip(
      `SoftDraw Pen — ${on ? "Drawing" : "Pass-through"}  (Ctrl+Alt+D)`
    );
    buildTrayMenu();
  }
}

function buildTrayMenu() {
  if (!tray) return;
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "SoftDraw Screen Pen", enabled: false },
      { type: "separator" },
      {
        label: `${drawMode ? "● " : ""}Draw mode`,
        click: () => setDrawMode(true),
      },
      {
        label: `${!drawMode ? "● " : ""}Pass-through (use desktop)`,
        click: () => setDrawMode(false),
      },
      { type: "separator" },
      { label: "Clear drawing   (Ctrl+Alt+C)", click: () => win && win.reload() },
      { label: "Quit   (Ctrl+Alt+Q)", click: () => app.quit() },
    ])
  );
}

function createWindow() {
  const { bounds } = screen.getPrimaryDisplay();
  win = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    fullscreenable: false,
    webPreferences: { contextIsolation: true },
  });
  win.setAlwaysOnTop(true, "screen-saver");
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.loadURL(SCREEN_URL);
  setDrawMode(true);
}

app.whenReady().then(() => {
  createWindow();

  try {
    const icon = nativeImage.createFromPath(path.join(__dirname, "icon.png"));
    tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
    tray.setToolTip("SoftDraw Screen Pen");
    buildTrayMenu();
    tray.on("click", () => setDrawMode(!drawMode));
  } catch {
    tray = null;
  }

  globalShortcut.register("Control+Alt+D", () => setDrawMode(!drawMode));
  globalShortcut.register("Control+Alt+C", () => win && win.reload());
  globalShortcut.register("Control+Alt+Q", () => app.quit());
});

app.on("will-quit", () => globalShortcut.unregisterAll());
app.on("window-all-closed", () => app.quit());
