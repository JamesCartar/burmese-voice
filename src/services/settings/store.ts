import { app, safeStorage } from 'electron';
import { existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import {
  defaultSettings,
  settingsSchema,
  type PublicSettings,
  type SettingsInput,
} from '../../shared/contracts';

export class SettingsStore {
  private file = join(app.getPath('userData'), 'settings.json');
  private settings = { ...defaultSettings };
  private encryptedKey = '';

  constructor() {
    if (!existsSync(this.file)) return;
    const stored = JSON.parse(readFileSync(this.file, 'utf8'));
    this.settings = settingsSchema.parse(stored);
    if (typeof stored.encryptedKey === 'string')
      this.encryptedKey = stored.encryptedKey;
  }

  get(): PublicSettings {
    return {
      ...this.settings,
      hasKey: Boolean(this.encryptedKey || process.env.OPENROUTER_API_KEY),
    };
  }

  key(): string {
    if (!this.encryptedKey) return process.env.OPENROUTER_API_KEY || '';
    if (!safeStorage.isEncryptionAvailable())
      throw new Error('Windows credential encryption is unavailable.');
    return safeStorage.decryptString(Buffer.from(this.encryptedKey, 'base64'));
  }

  save(input: SettingsInput): PublicSettings {
    let encryptedKey = this.encryptedKey;
    if (input.apiKey !== undefined) {
      if (!safeStorage.isEncryptionAvailable())
        throw new Error('Windows credential encryption is unavailable.');
      encryptedKey = input.apiKey.trim()
        ? safeStorage.encryptString(input.apiKey.trim()).toString('base64')
        : '';
    }
    const settings = settingsSchema.parse(input);
    writeFileSync(
      `${this.file}.tmp`,
      JSON.stringify({ ...settings, encryptedKey }),
      'utf8',
    );
    renameSync(`${this.file}.tmp`, this.file);
    this.settings = settings;
    this.encryptedKey = encryptedKey;
    return this.get();
  }
}
