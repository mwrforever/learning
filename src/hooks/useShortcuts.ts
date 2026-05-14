import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';

interface ShortcutHandler {
  key: string;
  handler: () => void;
}

export function useShortcuts(handlers: ShortcutHandler[]) {
  useEffect(() => {
    const unlisteners: Promise<() => void>[] = [];

    handlers.forEach(({ key, handler }) => {
      const unlisten = listen(key, handler);
      unlisteners.push(unlisten);
    });

    return () => {
      unlisteners.forEach(unlisten => {
        unlisten.then(fn => fn());
      });
    };
  }, [handlers]);
}
