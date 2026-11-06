import { useEffect, useState } from 'react';
import {
  defaultSettings,
  initialState,
  unwrap,
  type PublicSettings,
} from '../../../shared/contracts';

export function useSettings() {
  const [settings, setSettings] = useState<PublicSettings>({
    ...defaultSettings,
    hasKey: false,
  });
  const [state, setState] = useState(initialState);
  const [transcript, setTranscript] = useState('');
  useEffect(() => setTranscript(state.text), [state.text]);
  const [apiKey, setApiKey] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    let receivedEvent = false;
    const unsubscribe = window.voice.onState((value) => {
      receivedEvent = true;
      setState(value);
    });
    void Promise.all([window.voice.settings(), window.voice.state()])
      .then(([config, current]) => {
        if (!alive) return;
        setSettings(unwrap(config));
        if (!receivedEvent) setState(unwrap(current));
        setReady(true);
      })
      .catch((error) => {
        if (alive) setNotice(String(error));
      });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);
  async function save(removeKey = false) {
    setBusy(true);
    try {
      setSettings(
        unwrap(
          await window.voice.save({
            ...settings,
            apiKey: removeKey ? '' : apiKey.trim() || undefined,
          }),
        ),
      );
      setApiKey('');
      setNotice('Settings saved. Changes apply to the next dictation session.');
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'Settings could not be saved.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function copy(text: string) {
    try {
      unwrap(await window.voice.copy(text));
      setNotice('Copied to clipboard.');
    } catch (error) {
      setNotice(String(error));
    }
  }
  async function showToolbar() {
    try {
      unwrap(await window.voice.showToolbar());
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'Could not show toolbar.',
      );
    }
  }
  return {
    showToolbar,
    settings,
    setSettings,
    state,
    apiKey,
    setApiKey,
    notice,
    busy,
    ready,
    save,
    copy,
    transcript,
    setTranscript,
  };
}
