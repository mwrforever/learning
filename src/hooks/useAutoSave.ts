import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

interface UseAutoSaveOptions {
  content: string;
  filePath: string | null;
  onSaving?: () => void;
  onSaved?: () => void;
  onError?: (error: string) => void;
}

export function useAutoSave({ content, filePath, onSaving, onSaved, onError }: UseAutoSaveOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef<string>(content);

  useEffect(() => {
    if (!filePath) return;
    if (content === lastSavedContentRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    onSaving?.();

    timeoutRef.current = setTimeout(async () => {
      try {
        await invoke('write_file', { path: filePath, content });
        lastSavedContentRef.current = content;
        onSaved?.();
      } catch (error) {
        onError?.(String(error));
      }
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, filePath, onSaving, onSaved, onError]);

  const saveImmediately = async () => {
    if (!filePath || content === lastSavedContentRef.current) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    try {
      await invoke('write_file', { path: filePath, content });
      lastSavedContentRef.current = content;
      onSaved?.();
    } catch (error) {
      onError?.(String(error));
    }
  };

  return { saveImmediately };
}
