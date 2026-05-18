import { FileType, SaveStatus } from '../types';

interface StatusBarProps {
  filePath: string | null;
  saveStatus: SaveStatus;
  fileType: FileType;
  wordCount: number;
}

export function StatusBar({ filePath, saveStatus, fileType, wordCount }: StatusBarProps) {
  const getFileTypeLabel = (type: FileType) => {
    switch (type) {
      case 'markdown': return 'Markdown';
      case 'html': return 'HTML';
      default: return '纯文本';
    }
  };

  const getSaveStatusLabel = (status: SaveStatus) => {
    switch (status) {
      case 'saved': return '已保存';
      case 'saving': return '保存中...';
      case 'unsaved': return '未保存';
    }
  };

  const getSaveStatusColor = (status: SaveStatus) => {
    switch (status) {
      case 'saved': return 'text-green-500';
      case 'saving': return 'text-yellow-500';
      case 'unsaved': return 'text-red-500';
    }
  };

  return (
    <div
      className="px-4 py-1.5 flex items-center text-xs border-t gap-4"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
    >
      <span className="truncate flex-1" style={{ color: 'var(--text-muted)' }}>
        {filePath || '未保存文件'}
      </span>

      <div className="flex items-center gap-4">
        <span>{wordCount} 字符</span>
        <span>{getFileTypeLabel(fileType)}</span>
        <span className={getSaveStatusColor(saveStatus)}>
          {getSaveStatusLabel(saveStatus)}
        </span>
      </div>
    </div>
  );
}
