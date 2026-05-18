import { useState, useRef, useEffect } from 'react';
import { useEditor } from '../contexts/EditorContext';
import { useFileOperations } from '../hooks/useFileOperations';
import { useTheme } from '../hooks/useTheme';
import { HelpModal } from './HelpModal';

interface MenuItem {
  label: string;
  action?: () => void;
  divider?: boolean;
  disabled?: boolean;
}

interface Menu {
  label: string;
  items: MenuItem[];
}

export function MenuBar() {
  const { editor, setContent, setFilePath, setFileType, setViewMode, setIsDirty, setSaveStatus, resetEditor } = useEditor();
  const { openFile, saveFile, saveAsFile } = useFileOperations();
  const { setTheme } = useTheme();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const menuBarRef = useRef<HTMLDivElement>(null);

  const handleNewFile = () => {
    resetEditor();
    setActiveMenu(null);
  };

  const handleOpenFile = async () => {
    const result = await openFile();
    if (result) {
      setContent(result.content);
      setFilePath(result.path);
      const ext = result.path.split('.').pop()?.toLowerCase();
      const fileType = ext === 'md' ? 'markdown' : ext === 'html' || ext === 'htm' ? 'html' : 'text';
      setFileType(fileType);
      setIsDirty(false);
      setSaveStatus('saved');
    }
    setActiveMenu(null);
  };

  const handleSave = async () => {
    if (editor.filePath) {
      await saveFile(editor.filePath, editor.content);
      setSaveStatus('saved');
      setIsDirty(false);
    } else {
      await handleSaveAs();
    }
    setActiveMenu(null);
  };

  const handleSaveAs = async () => {
    const path = await saveAsFile(editor.content);
    if (path) {
      const ext = path.split('.').pop()?.toLowerCase();
      const fileType = ext === 'md' ? 'markdown' : ext === 'html' || ext === 'htm' ? 'html' : 'text';
      setFilePath(path);
      setFileType(fileType);
      setSaveStatus('saved');
      setIsDirty(false);
    }
    setActiveMenu(null);
  };

  const menus: Menu[] = [
    {
      label: 'File',
      items: [
        { label: 'New', action: handleNewFile, disabled: false },
        { label: 'Open...', action: handleOpenFile, disabled: false },
        { divider: true, label: '' },
        { label: 'Save', action: handleSave, disabled: false },
        { label: 'Save As...', action: handleSaveAs, disabled: false },
        { divider: true, label: '' },
        { label: 'Exit', action: () => window.close(), disabled: false },
      ],
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', action: () => document.execCommand('undo'), disabled: false },
        { label: 'Redo', action: () => document.execCommand('redo'), disabled: false },
        { divider: true, label: '' },
        { label: 'Cut', action: () => document.execCommand('cut'), disabled: false },
        { label: 'Copy', action: () => document.execCommand('copy'), disabled: false },
        { label: 'Paste', action: () => document.execCommand('paste'), disabled: false },
        { divider: true, label: '' },
        { label: 'Find', action: () => {}, disabled: true },
        { label: 'Replace', action: () => {}, disabled: true },
      ],
    },
    {
      label: 'Paragraph',
      items: [
        { label: 'Heading 1', action: () => insertAtCursor('# '), disabled: false },
        { label: 'Heading 2', action: () => insertAtCursor('## '), disabled: false },
        { label: 'Heading 3', action: () => insertAtCursor('### '), disabled: false },
        { label: 'Heading 4', action: () => insertAtCursor('#### '), disabled: false },
        { label: 'Heading 5', action: () => insertAtCursor('##### '), disabled: false },
        { label: 'Heading 6', action: () => insertAtCursor('###### '), disabled: false },
        { divider: true, label: '' },
        { label: 'Quote', action: () => insertAtCursor('> '), disabled: false },
        { label: 'Bullet List', action: () => insertAtCursor('- '), disabled: false },
        { label: 'Numbered List', action: () => insertAtCursor('1. '), disabled: false },
      ],
    },
    {
      label: 'Format',
      items: [
        { label: 'Bold', action: () => document.execCommand('bold'), disabled: false },
        { label: 'Italic', action: () => document.execCommand('italic'), disabled: false },
        { label: 'Underline', action: () => document.execCommand('underline'), disabled: false },
        { label: 'Strikethrough', action: () => document.execCommand('strikeThrough'), disabled: false },
        { divider: true, label: '' },
        { label: 'Code', action: () => insertAtCursor('`code`'), disabled: false },
        { label: 'Link', action: () => insertAtCursor('[text](url)'), disabled: false },
      ],
    },
    {
      label: 'View',
      items: [
        { label: 'Toggle Sidebar', action: () => {}, disabled: true },
        { label: 'Source Mode', action: () => setViewMode(editor.viewMode === 'wysiwyg' ? 'source' : 'wysiwyg'), disabled: false },
        { label: 'Focus Mode', action: () => {}, disabled: true },
      ],
    },
    {
      label: 'Theme',
      items: [
        { label: 'Light', action: () => setTheme('light'), disabled: false },
        { label: 'Dark', action: () => setTheme('dark'), disabled: false },
        { label: 'Solarized', action: () => setTheme('solarized'), disabled: false },
        { label: 'System', action: () => setTheme('system'), disabled: false },
      ],
    },
    {
      label: 'Help',
      items: [
        { label: 'Keyboard Shortcuts', action: () => setShowHelp(true), disabled: false },
        { label: 'About', action: () => setShowHelp(true), disabled: false },
      ],
    },
  ];

  function insertAtCursor(text: string) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
    }
    setActiveMenu(null);
  }

  const handleMenuClick = (menuLabel: string) => {
    setActiveMenu(activeMenu === menuLabel ? null : menuLabel);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={menuBarRef}
      className="flex items-center h-8 bg-[var(--bg-secondary)] border-b border-[var(--border)] select-none"
      style={{ fontSize: '13px' }}
    >
      {menus.map((menu) => (
        <div key={menu.label} className="relative">
          <button
            onClick={() => handleMenuClick(menu.label)}
            onMouseEnter={() => activeMenu && setActiveMenu(menu.label)}
            className={`px-3 h-8 flex items-center hover:bg-[var(--hover-bg)] ${
              activeMenu === menu.label ? 'bg-[var(--hover-bg)]' : ''
            }`}
            style={{ color: 'var(--text-primary)' }}
          >
            {menu.label}
          </button>
          {activeMenu === menu.label && (
            <div
              className="absolute top-full left-0 min-w-48 py-1 bg-[var(--bg-primary)] border border-[var(--border)] shadow-lg z-50"
              style={{ color: 'var(--text-primary)' }}
            >
              {menu.items.map((item, idx) =>
                item.divider ? (
                  <div key={idx} className="border-t border-[var(--border)] my-1" />
                ) : (
                  <button
                    key={idx}
                    onClick={item.action}
                    disabled={item.disabled}
                    className={`w-full px-4 py-1.5 text-left hover:bg-[var(--hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {item.label}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ))}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}