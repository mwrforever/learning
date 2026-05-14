interface StatusBarProps {
  saveStatus: 'saved' | 'saving' | 'unsaved';
  filePath: string | null;
  wordCount: number;
}

export function StatusBar({ saveStatus, filePath, wordCount }: StatusBarProps) {
  const getStatusText = () => {
    switch (saveStatus) {
      case 'saved':
        return '已保存';
      case 'saving':
        return '保存中...';
      case 'unsaved':
        return '未保存';
    }
  };

  const getStatusColor = () => {
    switch (saveStatus) {
      case 'saved':
        return 'text-green-400';
      case 'saving':
        return 'text-yellow-400';
      case 'unsaved':
        return 'text-red-400';
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-sm">
      <div className="flex items-center gap-4">
        <span className={getStatusColor()}>{getStatusText()}</span>
        {filePath && <span className="text-gray-400">{filePath}</span>}
      </div>
      <div className="text-gray-400">{wordCount} 字</div>
    </div>
  );
}
