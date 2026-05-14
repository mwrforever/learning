import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

interface UseAutoSaveOptions {
  content: string;
  filePath: string | null;
  onSaveComplete?: () => void;
  onSaveError?: (error: string) => void;
}

export function useAutoSave({
  content,
  filePath,
  onSaveComplete,
  onSaveError,
}: UseAutoSaveOptions) {
  const saveTimeoutRef = useRef<number | null>(null);
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (!filePath || !content) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      
      try {
        await invoke('save_file', { path: filePath, content });
        onSaveComplete?.();
      } catch (error) {
        onSaveError?.(String(error));
      } finally {
        isSavingRef.current = false;
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, filePath, onSaveComplete, onSaveError]);

  useEffect(() => {
    const unlisten = listen('save-request', async () => {
      if (!filePath || !content) return;
      try {
        await invoke('save_file', { path: filePath, content });
        onSaveComplete?.();
      } catch (error) {
        onSaveError?.(String(error));
      }
    });
    return () => { unlisten.then(fn => fn()); };
  }, [content, filePath, onSaveComplete, onSaveError]);
}
