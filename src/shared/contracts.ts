import { z } from 'zod';

export const settingsSchema = z.object({
  model: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[\w./:~+-]+$/),
  continuous: z.boolean(),
  autoInsert: z.boolean().default(true),
  showToolbar: z.boolean(),
});
export type Settings = z.infer<typeof settingsSchema>;
export const defaultSettings: Settings = {
  model: 'google/gemini-2.5-flash',
  continuous: false,
  autoInsert: true,
  showToolbar: true,
};
export const saveSettingsSchema = settingsSchema.extend({
  apiKey: z.string().max(512).optional(),
});
export type SettingsInput = z.infer<typeof saveSettingsSchema>;
export type PublicSettings = Settings & { hasKey: boolean };
export const stateSchema = z.object({
  phase: z.enum(['idle', 'starting', 'recording', 'transcribing', 'error']),
  text: z.string().max(100000),
  message: z.string().max(1000),
});
export type DictationState = z.infer<typeof stateSchema>;
export const initialState: DictationState = {
  phase: 'idle',
  text: '',
  message: '',
};
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
export { channels } from './channels';
export interface AudioModel {
  id: string;
  name: string;
  kind: 'transcription' | 'chat';
}
export interface VoiceBridge {
  models(): Promise<Result<AudioModel[]>>;
  settings(): Promise<Result<PublicSettings>>;
  save(input: SettingsInput): Promise<Result<PublicSettings>>;
  beginDictation(): Promise<Result<void>>;
  transcribe(
    audio: ArrayBuffer,
  ): Promise<Result<{ text: string; message: string }>>;
  state(): Promise<Result<DictationState>>;
  publish(state: DictationState): Promise<Result<void>>;
  copy(text: string): Promise<Result<void>>;
  openSettings(): Promise<Result<void>>;
  showToolbar(): Promise<Result<void>>;
  quit(): Promise<Result<void>>;
  onState(listener: (state: DictationState) => void): () => void;
  onToggle(listener: () => void): () => void;
}
export function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.value;
}
