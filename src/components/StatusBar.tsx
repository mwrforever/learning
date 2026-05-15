import { Theme } from '../types';

interface StatusBarProps {
  saveStatus: 'saved' | 'saving' | 'unsaved';
  filePath: string | null;
  wordCount: number;
  theme: Theme;
}

export function StatusBar({ saveStatus, filePath, wordCount, theme }: StatusBarProps) {
  const getStatusText = () => {
    switch (saveStatus) {
      case 'saved':
        return '';
      case 'saving':
        return '保存中...';
      case 'unsaved':
        return '●';
    }
  };

  const getStatusColor = () => {
    switch (saveStatus) {
      case 'saved':
        return theme === 'dark' ? 'text-gray-500' : 'text-gray-400';
      case 'saving':
        return theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600';
      case 'unsaved':
        return theme === 'dark' ? 'text-blue-400' : 'text-blue-600';
    }
  };

  return (
    <div className={`flex items-center justify-between px-6 py-2 text-sm ${
      theme === 'dark' ? 'bg-[#252526] text-gray-400' : 'bg-gray-50 text-gray-600'
    }`}>
      <div className="flex items-center gap-4">
        <span className={getStatusColor()}>{getStatusText()}</span>
      </div>
      <div className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>{wordCount} 字</div>
    </div>
  );
}
