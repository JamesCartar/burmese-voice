import { BrowserWindow, Menu, Tray, nativeImage, screen, app } from 'electron';
import path from 'node:path';

// Matches the toolbar's Tailwind w-24 / h-8 dimensions at the default root size.
const toolbarSize = { width: 96, height: 32 };

export class Windows {
  toolbar!: BrowserWindow;
  settings!: BrowserWindow;
  private tray!: Tray;
  quitting = false;

  create(showToolbar: boolean) {
    this.toolbar = this.createWindow('toolbar', {
      ...toolbarSize,
      frame: false,
      transparent: true,
      resizable: false,
      maximizable: false,
      minimizable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      hasShadow: false,
    });
    this.toolbar.setAlwaysOnTop(true, 'floating');
    const area = screen.getPrimaryDisplay().workArea;
    this.toolbar.setPosition(
      area.x + Math.round((area.width - toolbarSize.width) / 2),
      area.y + 24,
    );
    this.settings = this.createWindow('settings', {
      width: 640,
      height: 760,
      minWidth: 480,
      minHeight: 560,
    });
    this.settings.on('close', (event) => {
      if (!this.quitting) {
        event.preventDefault();
        this.settings.hide();
      }
    });
    this.toolbar.on('close', () => app.quit());
    this.toolbar.once('ready-to-show', () => {
      if (showToolbar) this.showToolbar();
    });
    this.settings.once('ready-to-show', () => this.settings.show());
    this.tray = new Tray(this.trayIcon());
    this.tray.setToolTip('Burmese Voice — microphone off');
    this.tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: 'Show toolbar', click: () => this.showToolbar() },
        { label: 'Settings & transcript', click: () => this.settings.show() },
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() },
      ]),
    );
    this.tray.on('double-click', () => this.settings.show());
    screen.on('display-removed', () => this.keepVisible());
    screen.on('display-metrics-changed', () => this.keepVisible());
    this.toolbar.on('moved', () => this.keepVisible());
  }

  showToolbar() {
    this.keepVisible();
    this.toolbar.setAlwaysOnTop(true, 'floating');
    this.toolbar.showInactive();
    this.toolbar.moveTop();
  }

  private keepVisible() {
    const bounds = this.toolbar.getBounds();
    const area = screen.getDisplayMatching(bounds).workArea;
    const x = Math.max(
      area.x,
      Math.min(bounds.x, area.x + area.width - bounds.width),
    );
    const y = Math.max(
      area.y,
      Math.min(bounds.y, area.y + area.height - bounds.height),
    );
    if (x !== bounds.x || y !== bounds.y) this.toolbar.setPosition(x, y);
  }

  private createWindow(
    view: string,
    options: Electron.BrowserWindowConstructorOptions,
  ) {
    const window = new BrowserWindow({
      ...options,
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        backgroundThrottling: false,
      },
    });
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('will-navigate', (event, url) => {
      // Vite may reload this exact document after optimizing dependencies.
      // Block navigation away, not same-document development reloads.
      if (url !== window.webContents.getURL()) event.preventDefault();
    });
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      void window.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}#${view}`);
    } else {
      void window.loadFile(
        path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
        { hash: view },
      );
    }
    return window;
  }

  private trayIcon() {
    const data = Buffer.alloc(16 * 16 * 4);
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const microphone =
          (x >= 6 && x <= 9 && y >= 2 && y <= 9) ||
          (y === 11 && x >= 4 && x <= 11) ||
          (x === 8 && y >= 11 && y <= 14);
        const offset = (y * 16 + x) * 4;
        data[offset] = 90;
        data[offset + 1] = 190;
        data[offset + 2] = 110;
        data[offset + 3] = microphone ? 255 : 0;
      }
    return nativeImage.createFromBitmap(data, { width: 16, height: 16 });
  }
}
