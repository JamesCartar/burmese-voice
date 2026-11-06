import { app, dialog, globalShortcut, session } from 'electron';
import path from 'node:path';
import { channels } from './shared/contracts';
import { SettingsStore } from './services/settings/store';
import { OpenRouterProvider } from './services/transcription/openrouter';
import { ModelCatalog } from './services/transcription/catalog';
import { Windows } from './main/windows';
import { registerIpc } from './main/ipc';
import { TextInsertion } from './services/windows/text-insertion';

app.setName('Burmese Voice');
app.setPath('userData', path.join(app.getPath('appData'), 'Burmese Voice'));
const windows = new Windows();
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => windows.settings?.show());
  app.on('before-quit', () => {
    windows.quitting = true;
    globalShortcut.unregisterAll();
  });
  void app
    .whenReady()
    .then(() => {
      const store = new SettingsStore();
      session.defaultSession.setPermissionRequestHandler(
        (contents, permission, callback, details) => {
          callback(
            contents === windows.toolbar?.webContents &&
              permission === 'media' &&
              'mediaTypes' in details &&
              details.mediaTypes?.includes('audio') === true &&
              !details.mediaTypes?.includes('video'),
          );
        },
      );
      session.defaultSession.setPermissionCheckHandler(
        (contents, permission) =>
          contents === windows.toolbar?.webContents && permission === 'media',
      );
      windows.create(store.get().showToolbar);
      const catalog = new ModelCatalog();
      const insertion = new TextInsertion(() => {
        const handle = windows.toolbar.getNativeWindowHandle();
        return handle.length === 8
          ? handle.readBigUInt64LE()
          : BigInt(handle.readUInt32LE());
      });
      insertion.startTracking();
      app.on('before-quit', () => insertion.dispose());
      registerIpc(
        windows,
        store,
        new OpenRouterProvider(catalog),
        catalog,
        insertion,
      );
      if (
        !globalShortcut.register('Control+Alt+Space', () => {
          windows.showToolbar();
          windows.toolbar.webContents.send(channels.toggle);
        })
      ) {
        void dialog.showMessageBox({
          message:
            'Ctrl+Alt+Space is already in use. Use the microphone button instead.',
        });
      }
    })
    .catch((error: unknown) => {
      dialog.showErrorBox(
        'Burmese Voice could not start',
        error instanceof Error ? error.message : 'Unknown startup error',
      );
      app.quit();
    });
}
