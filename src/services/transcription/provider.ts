export interface TranscriptionRequest {
  audio: Uint8Array;
  model: string;
  apiKey: string;
  signal: AbortSignal;
}
export interface TranscriptionProvider {
  transcribe(request: TranscriptionRequest): Promise<string>;
}
