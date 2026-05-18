import { useState, useEffect } from 'react';
import { useEditor } from '../contexts/EditorContext';

interface ContextMenuState {
  x: number;
  y: number;
  tabId: string;
}

export function TabBar() {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const { editor, setActiveTab, closeTab, closeAllTabs } = useEditor();

  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  if (editor.tabs.length === 0) {
    return null;
  }

  return (
    <div
      className="flex items-center overflow-x-auto border-b"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
    >
      {editor.tabs.map(tab => (
        <div
          key={tab.id}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer border-r ${
            tab.id === editor.activeTabId ? 'bg-[var(--bg-primary)]' : 'hover:bg-hover-bg'
          }`}
          style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          onClick={() => setActiveTab(tab.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, tabId: tab.id });
          }}
        >
          <span className="truncate max-w-[120px]">
            {tab.filePath.split(/[/\\]/).pop() || '未命名'}
          </span>
          {tab.isDirty && <span className="w-2 h-2 rounded-full bg-orange-500" />}
          <button
            onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
            className="p-0.5 rounded hover:bg-hover-bg"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      {contextMenu && (
        <div
          className="fixed bg-[var(--bg-secondary)] rounded-lg shadow-lg border py-1 z-50 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y, borderColor: 'var(--border)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-2 text-sm text-left hover:bg-hover-bg"
            style={{ color: 'var(--text-primary)' }}
            onClick={() => { closeTab(contextMenu.tabId); setContextMenu(null); }}
          >
            关闭
          </button>
          <button
            className="w-full px-4 py-2 text-sm text-left hover:bg-hover-bg"
            style={{ color: 'var(--text-primary)' }}
            onClick={() => { closeAllTabs(); setContextMenu(null); }}
          >
            关闭所有
          </button>
        </div>
      )}
    </div>
  );
}