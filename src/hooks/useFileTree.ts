import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { FileTreeNode } from '../types';

interface DirectoryEntry {
  name: string;
  path: string;
  is_directory: boolean;
}

export function useFileTree() {
  const readDirectory = useCallback(async (dirPath: string): Promise<FileTreeNode[]> => {
    try {
      const entries = await invoke<DirectoryEntry[]>('read_directory', { path: dirPath });
      return entries
        .filter((entry) => !entry.name.startsWith('.'))
        .sort((a, b) => {
          if (a.is_directory !== b.is_directory) {
            return a.is_directory ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        })
        .map((entry) => ({
          name: entry.name,
          path: entry.path,
          isDirectory: entry.is_directory,
          children: entry.is_directory ? [] : undefined,
        }));
    } catch (error) {
      console.error('读取目录失败:', error);
      return [];
    }
  }, []);

  return { readDirectory };
}