import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open, save } from '@tauri-apps/api/dialog';

export interface FileInfo {
  content: string;
  file_type: string;
}

export function useFileOperations() {
  const openFile = useCallback(async (): Promise<{ path: string; content: string; fileType: string } | null> => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          { name: 'Markdown', extensions: ['md'] },
          { name: 'HTML', extensions: ['html', 'htm'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (!selected || Array.isArray(selected)) return null;

      const result = await invoke<FileInfo>('read_file', { path: selected });
      return { path: selected, content: result.content, fileType: result.file_type };
    } catch (error) {
      console.error('打开文件失败:', error);
      return null;
    }
  }, []);

  const saveAsFile = useCallback(async (content: string): Promise<string | null> => {
    try {
      const filePath = await save({
        filters: [
          { name: 'Markdown', extensions: ['md'] },
          { name: 'HTML', extensions: ['html'] },
        ],
      });

      if (!filePath) return null;

      await invoke('write_file', { path: filePath, content });
      return filePath;
    } catch (error) {
      console.error('保存文件失败:', error);
      return null;
    }
  }, []);

  const saveFile = useCallback(async (path: string, content: string): Promise<boolean> => {
    try {
      await invoke('write_file', { path, content });
      return true;
    } catch (error) {
      console.error('保存文件失败:', error);
      return false;
    }
  }, []);

  const createFile = useCallback(async (path: string): Promise<boolean> => {
    try {
      await invoke('create_file', { path });
      return true;
    } catch (error) {
      console.error('创建文件失败:', error);
      return false;
    }
  }, []);

  const createDirectory = useCallback(async (path: string): Promise<boolean> => {
    try {
      await invoke('create_directory', { path });
      return true;
    } catch (error) {
      console.error('创建目录失败:', error);
      return false;
    }
  }, []);

  return { openFile, saveFile, saveAsFile, createFile, createDirectory };
}
