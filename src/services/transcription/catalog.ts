import type { AudioModel } from '../../shared/contracts';
import { createOpenRouterClient, providerError } from './client';

export class ModelCatalog {
  private cache: AudioModel[] = [];
  private expires = 0;
  async list(): Promise<AudioModel[]> {
    if (this.cache.length && Date.now() < this.expires) return this.cache;
    try {
      const client = await createOpenRouterClient();
      const pages = await client.models.list(
        { inputModalities: 'audio', outputModalities: 'text,transcription' },
        { signal: AbortSignal.timeout(20000) },
      );
      const models: AudioModel[] = [];
      for await (const page of pages) {
        for (const model of page.result.data) {
          if (!model.architecture.inputModalities.includes('audio')) continue;
          const outputs = model.architecture.outputModalities;
          if (!outputs.includes('text') && !outputs.includes('transcription'))
            continue;
          // Batch-only models cannot serve an interactive dictation session.
          if (
            model.id.endsWith(':batch') ||
            model.id.startsWith('openrouter/auto')
          )
            continue;
          models.push({
            id: model.id,
            name: model.name,
            kind: outputs.includes('transcription') ? 'transcription' : 'chat',
          });
        }
      }
      this.cache = models.sort((a, b) => a.name.localeCompare(b.name));
      this.expires = Date.now() + 60000;
      return this.cache;
    } catch (error) {
      throw providerError(error);
    }
  }
  async get(id: string) {
    const model = (await this.list()).find((model) => model.id === id);
    if (!model)
      throw new Error(
        'This model is no longer in the audio catalog. Refresh models and select another.',
      );
    return model;
  }
}
