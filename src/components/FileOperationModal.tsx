import { useState, useEffect, useCallback } from 'react';

interface FileOperationModalProps {
  isOpen: boolean;
  operation: 'newFile' | 'newFolder' | 'rename' | null;
  defaultName?: string;
  targetPath?: string;
  onConfirm: (name: string, shouldOverwrite?: boolean) => void;
  onCancel: () => void;
  checkExists?: (path: string) => Promise<boolean>;
}

export function FileOperationModal({
  isOpen,
  operation,
  defaultName = '',
  targetPath,
  onConfirm,
  onCancel,
  checkExists
}: FileOperationModalProps) {
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      setError('');
    }
  }, [isOpen, defaultName]);

  const handleConfirm = useCallback(async (shouldOverwrite = false) => {
    if (!name.trim()) return;

    // Check if file/folder already exists before creating
    if (checkExists && targetPath && (operation === 'newFile' || operation === 'newFolder' || operation === 'rename')) {
      // Tauri uses forward slashes even on Windows, so normalize path separators
      const fullPath = targetPath.replace(/\\/g, '/') + '/' + name.trim();
      const exists = await checkExists(fullPath);
      if (exists && !shouldOverwrite) {
        setError('该名称已存在，是否覆盖？');
        return;
      }
    }

    setError('');
    onConfirm(name.trim(), shouldOverwrite);
  }, [name, targetPath, operation, checkExists, onConfirm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) handleConfirm(false);
  };

  const handleOverwrite = () => {
    handleConfirm(true);
  };

  if (!isOpen) return null;

  const title = operation === 'newFile' ? '新建文件' : operation === 'newFolder' ? '新建文件夹' : operation === 'rename' ? '重命名' : '';
  const confirmText = operation === 'rename' ? '确定' : '创建';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--bg-secondary)] rounded-lg p-4 w-80 border border-[var(--border)]">
        <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            placeholder={operation === 'newFile' ? '文件名.md' : '文件夹名称'}
            className="w-full px-3 py-2 rounded border mb-2 text-sm"
            style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: error ? 'var(--color-error, #ef4444)' : 'var(--border)' }}
            autoFocus
          />
          {error && (
            <div className="mb-4">
              <p className="text-sm text-red-500 mb-2">{error}</p>
              {error.includes('覆盖') && (
                <button
                  type="button"
                  onClick={handleOverwrite}
                  className="px-3 py-1 text-sm rounded border border-red-500 text-red-500 hover:bg-red-500/10"
                >
                  覆盖
                </button>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded hover:bg-hover-bg" style={{ color: 'var(--text-primary)' }}>
              取消
            </button>
            <button type="submit" className="px-4 py-2 text-sm rounded bg-accent text-white">
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}