import type { VoiceBridge } from '../shared/contracts';
declare global {
  interface Window {
    voice: VoiceBridge;
  }
}
