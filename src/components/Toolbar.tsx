import { useEditor } from '../contexts/EditorContext';
import { useTheme } from '../hooks/useTheme';

interface ToolbarProps {
  onNewFile: () => void;
  onSave: () => void;
}

export function Toolbar({ onNewFile, onSave }: ToolbarProps) {
  const { editor, setViewMode } = useEditor();
  const { theme, setTheme } = useTheme();

  const btnBase = 'px-3 py-1.5 rounded text-sm font-medium transition-colors';
  const btnSecondary = `${btnBase} hover:bg-hover-bg`;
  const btnActive = `${btnBase} bg-accent text-white`;

  const getThemeIcon = () => {
    if (theme === 'light') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    } else if (theme === 'dark') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    }
  };

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <div
      className="px-4 py-2 flex items-center gap-3 border-b select-none"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
    >
      <h1 className="text-base font-bold mr-4" style={{ color: 'var(--text-primary)' }}>
        Markdown Editor
      </h1>

      <button onClick={onNewFile} className={btnSecondary} style={{ color: 'var(--text-primary)' }}>
        新建
      </button>
      <button onClick={onSave} className={btnSecondary} style={{ color: 'var(--text-primary)' }}>
        保存
      </button>

      <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--border)' }} />

      <button
        onClick={() => setViewMode('wysiwyg')}
        className={editor.viewMode === 'wysiwyg' ? btnActive : btnSecondary}
        style={editor.viewMode === 'wysiwyg' ? {} : { color: 'var(--text-primary)' }}
      >
        预览
      </button>
      <button
        onClick={() => setViewMode('source')}
        className={editor.viewMode === 'source' ? btnActive : btnSecondary}
        style={editor.viewMode === 'source' ? {} : { color: 'var(--text-primary)' }}
      >
        源码
      </button>

      <div className="flex-1" />

      <button
        onClick={cycleTheme}
        className={`${btnBase} hover:bg-hover-bg`}
        title={`主题: ${theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '跟随系统'}`}
      >
        {getThemeIcon()}
      </button>
    </div>
  );
}