import { app, clipboard, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { z } from 'zod';
import {
  channels,
  initialState,
  saveSettingsSchema,
  stateSchema,
  type Result,
} from '../shared/contracts';
import type { SettingsStore } from '../services/settings/store';
import type { TranscriptionProvider } from '../services/transcription/provider';
import type { Windows } from './windows';
import type { ModelCatalog } from '../services/transcription/catalog';
import type { TextInsertion } from '../services/windows/text-insertion';

export function registerIpc(
  windows: Windows,
  store: SettingsStore,
  provider: TranscriptionProvider,
  catalog: ModelCatalog,
  insertion: TextInsertion,
) {
  let state = { ...initialState };
  let busy = false;
  const shutdown = new AbortController();
  app.on('before-quit', () => shutdown.abort());
  function handle(
    name: string,
    fn: (event: IpcMainInvokeEvent, input: unknown) => unknown,
  ) {
    ipcMain.handle(name, async (event, input): Promise<Result<unknown>> => {
      try {
        if (
          ![windows.toolbar.webContents, windows.settings.webContents].includes(
            event.sender,
          ) ||
          event.senderFrame !== event.sender.mainFrame
        ) {
          throw new Error('Untrusted caller.');
        }
        return { ok: true, value: await fn(event, input) };
      } catch (error) {
        return {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : 'Unexpected operation failure.',
        };
      }
    });
  }
  handle(channels.models, () => catalog.list());
  handle(channels.showToolbar, () => windows.showToolbar());
  handle(channels.settings, () => store.get());
  handle(channels.save, (_, input) =>
    store.save(saveSettingsSchema.parse(input)),
  );
  handle(channels.state, () => state);
  handle(channels.publish, (event, input) => {
    if (event.sender !== windows.toolbar.webContents)
      throw new Error('Only the toolbar owns dictation.');
    state = stateSchema.parse(input);
    windows.settings.webContents.send(channels.changed, state);
  });
  handle(channels.begin, (event) => {
    if (event.sender !== windows.toolbar.webContents || busy)
      throw new Error('Cannot begin dictation now.');
    insertion.begin();
  });
  handle(channels.transcribe, async (event, input) => {
    if (event.sender !== windows.toolbar.webContents)
      throw new Error('Only the toolbar may send audio.');
    if (
      !(input instanceof ArrayBuffer) ||
      input.byteLength < 1 ||
      input.byteLength > 5_000_000
    )
      throw new Error('Invalid audio recording.');
    if (busy) throw new Error('A transcription is already running.');
    busy = true;
    try {
      const text = await provider.transcribe({
        audio: new Uint8Array(input),
        model: store.get().model,
        apiKey: store.key(),
        signal: AbortSignal.any([shutdown.signal, AbortSignal.timeout(60000)]),
      });
      let message = text
        ? 'Ready. Review and copy the transcript in Settings.'
        : 'No speech was detected.';
      if (text && store.get().autoInsert && !shutdown.signal.aborted) {
        try {
          message = await insertion.insert(text);
        } catch {
          message =
            'Automatic insertion failed. Your transcript is available in Settings.';
        }
      }
      return { text, message };
    } finally {
      busy = false;
    }
  });
  handle(channels.copy, (_, input) => {
    clipboard.writeText(z.string().max(100000).parse(input));
  });
  handle(channels.openSettings, () => {
    windows.settings.show();
  });
  handle(channels.quit, () => {
    app.quit();
  });
}
