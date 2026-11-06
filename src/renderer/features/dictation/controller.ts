import {
  initialState,
  unwrap,
  type DictationState,
  type VoiceBridge,
} from '../../../shared/contracts';
import { MicrophoneRecorder } from '../../services/audio/recorder';

// Owns a dictation session; UI components only subscribe and send actions.
export class DictationController {
  private state = { ...initialState };
  private listeners = new Set<() => void>();
  private running = false;
  private active = false;
  private disposed = false;
  private recorder = new MicrophoneRecorder();
  constructor(private bridge: VoiceBridge) {}
  snapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(patch: Partial<DictationState>) {
    if (this.disposed) return;
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
    void this.bridge.publish(this.state);
  }
  toggle = async () => {
    if (this.running) {
      this.active = false;
      this.recorder.close();
      return;
    }
    this.running = true;
    this.active = true;
    this.update({ phase: 'starting', message: '' });
    try {
      unwrap(await this.bridge.beginDictation());
      const settings = unwrap(await this.bridge.settings());
      if (!settings.hasKey)
        throw new Error(
          'Open Settings from the tray and add your OpenRouter API key.',
        );
      if (!this.active) return;
      await this.recorder.open();
      const deadline = Date.now() + 120000;
      do {
        if (!this.active) break;
        this.update({
          phase: 'recording',
          message: 'Listening — press the mic to finish.',
        });
        const audio = await this.recorder.record(
          settings.continuous ? 15000 : 30000,
        );
        if (this.disposed) break;
        this.update({
          phase: 'transcribing',
          message: 'Transcribing — please pause speaking.',
        });
        const { text, message } = unwrap(await this.bridge.transcribe(audio));
        this.update({
          message,
          text: text
            ? [this.state.text, text].filter(Boolean).join('\n')
            : this.state.text,
        });
      } while (settings.continuous && this.active && Date.now() < deadline);
      this.update({ phase: 'idle' });
    } catch (error) {
      const cancelledBeforeRecording =
        !this.active && this.state.phase === 'starting';
      this.update({
        phase: cancelledBeforeRecording ? 'idle' : 'error',
        message: cancelledBeforeRecording
          ? 'Stopped.'
          : error instanceof Error
            ? error.message
            : 'Dictation failed.',
      });
    } finally {
      this.active = false;
      this.running = false;
      this.recorder.close();
      if (this.state.phase === 'starting')
        this.update({ phase: 'idle', message: 'Stopped.' });
    }
  };
  dispose() {
    this.disposed = true;
    this.active = false;
    this.recorder.close();
    this.listeners.clear();
  }
}
