import { contextBridge, ipcRenderer } from 'electron';
import { channels } from './shared/channels';
import type { VoiceBridge, DictationState } from './shared/contracts';

const bridge: VoiceBridge = {
  models: () => ipcRenderer.invoke(channels.models),
  settings: () => ipcRenderer.invoke(channels.settings),
  save: (input) => ipcRenderer.invoke(channels.save, input),
  beginDictation: () => ipcRenderer.invoke(channels.begin),
  transcribe: (audio) => ipcRenderer.invoke(channels.transcribe, audio),
  state: () => ipcRenderer.invoke(channels.state),
  publish: (state) => ipcRenderer.invoke(channels.publish, state),
  copy: (text) => ipcRenderer.invoke(channels.copy, text),
  openSettings: () => ipcRenderer.invoke(channels.openSettings),
  showToolbar: () => ipcRenderer.invoke(channels.showToolbar),
  quit: () => ipcRenderer.invoke(channels.quit),
  onState: (listener) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      state: DictationState,
    ) => listener(state);
    ipcRenderer.on(channels.changed, handler);
    return () => {
      ipcRenderer.removeListener(channels.changed, handler);
    };
  },
  onToggle: (listener) => {
    const handler = () => listener();
    ipcRenderer.on(channels.toggle, handler);
    return () => {
      ipcRenderer.removeListener(channels.toggle, handler);
    };
  },
};
contextBridge.exposeInMainWorld('voice', bridge);
