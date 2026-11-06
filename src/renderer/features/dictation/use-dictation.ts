import { useEffect, useState, useSyncExternalStore } from 'react';
import { DictationController } from './controller';

export function useDictation() {
  const [controller] = useState(() => new DictationController(window.voice));
  const state = useSyncExternalStore(controller.subscribe, controller.snapshot);
  useEffect(() => {
    const unsubscribe = window.voice.onToggle(() => {
      void controller.toggle();
    });
    return () => {
      unsubscribe();
      controller.dispose();
    };
  }, [controller]);
  return { state, toggle: controller.toggle };
}
