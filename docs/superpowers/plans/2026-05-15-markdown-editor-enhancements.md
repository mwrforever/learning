# Markdown Editor Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add file/folder CRUD operations, code syntax highlighting, help panel, remove toolbar buttons, and remember last opened folder.

**Architecture:** Add file operation modal component, highlight.js integration for code blocks, help modal, localStorage for folder persistence. Sidebar gains context menu for rename/delete. Toolbar simplified to only view toggles and theme.

**Tech Stack:** Tauri + React + Monaco Editor + highlight.js + Marked.js

---

## Task 1: Add File/Folder Creation with Input Modal

**Files:**
- Create: `src/components/FileOperationModal.tsx`
- Modify: `src/components/Sidebar.tsx:103-154`
- Modify: `src/hooks/useFileTree.ts:11-36`
- Modify: `src-tauri/src/commands.rs:46-63`

- [ ] **Step 1: Create file operation modal component**

```tsx
// src/components/FileOperationModal.tsx
import { useState, useEffect } from 'react';

interface FileOperationModalProps {
  isOpen: boolean;
  operation: 'newFile' | 'newFolder' | 'rename' | null;
  defaultName?: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export function FileOperationModal({ isOpen, operation, defaultName = '', onConfirm, onCancel }: FileOperationModalProps) {
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    if (isOpen) setName(defaultName);
  }, [isOpen, defaultName]);

  if (!isOpen) return null;

  const title = operation === 'newFile' ? '新建文件' : operation === 'newFolder' ? '新建文件夹' : operation === 'rename' ? '重命名' : '';
  const confirmText = operation === 'rename' ? '确定' : '创建';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onConfirm(name.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--bg-secondary)] rounded-lg p-4 w-80 border border-[var(--border)]">
        <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={operation === 'newFile' ? '文件名.md' : '文件夹名称'}
            className="w-full px-3 py-2 rounded border mb-4 text-sm"
            style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
            autoFocus
          />
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
```

- [ ] **Step 2: Add Rust commands for file/folder operations**

Modify `src-tauri/src/commands.rs` - add these commands before the closing bracket:

```rust
#[tauri::command]
pub async fn create_file(path: String, name: String) -> Result<String, String> {
    let file_path = format!("{}/{}", path, name);
    fs::write(&file_path, "").map_err(|e| format!("创建文件失败: {}", e))?;
    Ok(file_path)
}

#[tauri::command]
pub async fn create_directory(path: String, name: String) -> Result<String, String> {
    let dir_path = format!("{}/{}", path, name);
    tokio::fs::create_dir(&dir_path).await.map_err(|e| format!("创建文件夹失败: {}", e))?;
    Ok(dir_path)
}

#[tauri::command]
pub async fn delete_path(path: String) -> Result<(), String> {
    let path_obj = Path::new(&path);
    if path_obj.is_dir() {
        tokio::fs::remove_dir_all(&path).await.map_err(|e| format!("删除文件夹失败: {}", e))?;
    } else {
        tokio::fs::remove_file(&path).await.map_err(|e| format!("删除文件失败: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn rename_path(old_path: String, new_name: String) -> Result<String, String> {
    let path_obj = Path::new(&old_path);
    let parent = path_obj.parent().ok_or("无法获取父目录")?;
    let new_path = parent.join(&new_name);
    tokio::fs::rename(&path_obj, &new_path).await.map_err(|e| format!("重命名失败: {}", e))?;
    Ok(new_path.to_string_lossy().to_string())
}
```

- [ ] **Step 3: Update main.rs to register new commands**

Modify `src-tauri/src/main.rs:8-12`:

```rust
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::read_file,
            commands::write_file,
            commands::read_directory,
            commands::create_file,
            commands::create_directory,
            commands::delete_path,
            commands::rename_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 4: Add invoke calls to useFileTree hook**

Modify `src/hooks/useFileTree.ts`:

```typescript
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

  const createFile = useCallback(async (dirPath: string, name: string): Promise<string | null> => {
    try {
      return await invoke<string>('create_file', { path: dirPath, name });
    } catch (error) {
      console.error('创建文件失败:', error);
      return null;
    }
  }, []);

  const createDirectory = useCallback(async (dirPath: string, name: string): Promise<string | null> => {
    try {
      return await invoke<string>('create_directory', { path: dirPath, name });
    } catch (error) {
      console.error('创建文件夹失败:', error);
      return null;
    }
  }, []);

  const deletePath = useCallback(async (path: string): Promise<boolean> => {
    try {
      await invoke('delete_path', { path });
      return true;
    } catch (error) {
      console.error('删除失败:', error);
      return false;
    }
  }, []);

  const renamePath = useCallback(async (oldPath: string, newName: string): Promise<string | null> => {
    try {
      return await invoke<string>('rename_path', { old_path: oldPath, new_name: newName });
    } catch (error) {
      console.error('重命名失败:', error);
      return null;
    }
  }, []);

  return { readDirectory, createFile, createDirectory, deletePath, renamePath };
}
```

- [ ] **Step 5: Update Sidebar with context menu and new file/folder buttons**

Replace `src/components/Sidebar.tsx` content with context menu support:

```tsx
import { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useEditor } from '../contexts/EditorContext';
import { useFileTree } from '../hooks/useFileTree';
import { FileTreeNode } from '../types';
import { FileOperationModal } from './FileOperationModal';

function FolderIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase();
  let color = 'text-gray-400';
  if (ext === 'md') color = 'text-blue-400';
  else if (ext === 'html') color = 'text-orange-400';
  return (
    <svg className={`w-4 h-4 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

interface ContextMenuProps {
  x: number;
  y: number;
  node: FileTreeNode | null;
  currentPath: string | null;
  onNewFile: () => void;
  onNewFolder: () => void;
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
}

function ContextMenu({ x, y, node, currentPath, onNewFile, onNewFolder, onRename, onDelete, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div ref={ref} className="fixed bg-[var(--bg-secondary)] border rounded-lg shadow-lg py-1 z-50 min-w-32" style={{ left: x, top: y, borderColor: 'var(--border)' }}>
      {node && (
        <>
          <button className="w-full px-4 py-1.5 text-sm text-left hover:bg-hover-bg" style={{ color: 'var(--text-primary)' }} onClick={onRename}>重命名</button>
          <button className="w-full px-4 py-1.5 text-sm text-left hover:bg-hover-bg text-red-500" onClick={onDelete}>删除</button>
          <div className="h-px bg-[var(--border)] my-1" />
        </>
      )}
      <button className="w-full px-4 py-1.5 text-sm text-left hover:bg-hover-bg" style={{ color: 'var(--text-primary)' }} onClick={onNewFile}>新建文件</button>
      <button className="w-full px-4 py-1.5 text-sm text-left hover:bg-hover-bg" style={{ color: 'var(--text-primary)' }} onClick={onNewFolder}>新建文件夹</button>
    </div>
  );
}

interface TreeNodeProps {
  node: FileTreeNode;
  level: number;
  onContextMenu: (e: React.MouseEvent, node: FileTreeNode | null) => void;
}

function TreeNode({ node, level, onContextMenu }: TreeNodeProps) {
  const { sidebar, toggleFolder, setSelectedFile, setContent, setFilePath, setFileType } = useEditor();
  const { readDirectory } = useFileTree();
  const [children, setChildren] = useState<FileTreeNode[]>([]);
  const isExpanded = sidebar.expandedFolders.has(node.path);
  const isSelected = sidebar.selectedFile === node.path;

  const handleClick = async () => {
    if (node.isDirectory) {
      if (!isExpanded) {
        const childNodes = await readDirectory(node.path);
        setChildren(childNodes);
      }
      toggleFolder(node.path);
    } else {
      setSelectedFile(node.path);
      try {
        const result = await invoke<{ content: string; file_type: string }>('read_file', { path: node.path });
        setContent(result.content);
        setFilePath(node.path);
        const ext = node.name.split('.').pop()?.toLowerCase();
        if (ext === 'md') setFileType('markdown');
        else if (ext === 'html' || ext === 'htm') setFileType('html');
        else setFileType('text');
      } catch (error) {
        console.error('读取文件失败:', error);
      }
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 cursor-pointer rounded ${isSelected ? 'bg-accent/20 text-accent' : 'hover:bg-hover-bg'}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, node); }}
      >
        {node.isDirectory ? <FolderIcon isOpen={isExpanded} /> : <FileIcon name={node.name} />}
        <span className="text-sm truncate">{node.name}</span>
      </div>
      {node.isDirectory && isExpanded && children.length > 0 && (
        <div>
          {children.map((child) => <TreeNode key={child.path} node={child} level={level + 1} onContextMenu={onContextMenu} />)}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { sidebar, setCurrentPath, setFileTree } = useEditor();
  const { readDirectory } = useFileTree();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileTreeNode | null } | null>(null);
  const [modalState, setModalState] = useState<{ isOpen: boolean; operation: 'newFile' | 'newFolder' | 'rename' | null; defaultName: string; targetPath: string | null }>({ isOpen: false, operation: null, defaultName: '', targetPath: null });

  const handleOpenFolder = async () => {
    try {
      const { open } = await import('@tauri-apps/api/dialog');
      const selected = await open({ directory: true });
      if (selected && typeof selected === 'string') {
        setCurrentPath(selected);
        localStorage.setItem('lastOpenedFolder', selected);
        const tree = await readDirectory(selected);
        setFileTree(tree);
      }
    } catch (error) {
      console.error('打开文件夹失败:', error);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileTreeNode | null) => {
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const closeContextMenu = () => setContextMenu(null);

  const openModal = (operation: 'newFile' | 'newFolder' | 'rename', defaultName = '', targetPath: string | null = null) => {
    setModalState({ isOpen: true, operation, defaultName, targetPath });
    closeContextMenu();
  };

  const closeModal = () => setModalState({ isOpen: false, operation: null, defaultName: '', targetPath: null });

  return (
    <div className="w-56 h-full flex flex-col border-r overflow-hidden" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}>
      <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>文件</span>
        <button onClick={handleOpenFolder} className="p-1 rounded hover:bg-hover-bg" title="打开文件夹">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-1" onContextMenu={(e) => { e.preventDefault(); handleContextMenu(e, null); }}>
        {sidebar.fileTree.map((node) => <TreeNode key={node.path} node={node} level={0} onContextMenu={handleContextMenu} />)}
      </div>
      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} node={contextMenu.node} currentPath={sidebar.currentPath} onNewFile={() => openModal('newFile')} onNewFolder={() => openModal('newFolder')} onRename={() => contextMenu.node && openModal('rename', contextMenu.node.name)} onDelete={async () => { if (contextMenu.node) { const { deletePath } = useFileTree(); await deletePath(contextMenu.node.path); closeContextMenu(); window.location.reload(); } }} onClose={closeContextMenu} />}
      <FileOperationModal isOpen={modalState.isOpen} operation={modalState.operation} defaultName={modalState.defaultName} onConfirm={async (name) => { if (modalState.operation === 'newFile') { const { createFile } = useFileTree(); await createFile(sidebar.currentPath || '', name); } else if (modalState.operation === 'newFolder') { const { createDirectory } = useFileTree(); await createDirectory(sidebar.currentPath || '', name); } else if (modalState.operation === 'rename' && modalState.targetPath) { const { renamePath } = useFileTree(); await renamePath(modalState.targetPath, name); } closeModal(); window.location.reload(); }} onCancel={closeModal} />
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/FileOperationModal.tsx src/components/Sidebar.tsx src/hooks/useFileTree.ts src-tauri/src/commands.rs src-tauri/src/main.rs
git commit -m "feat: add file/folder CRUD operations with context menu"
```

---

## Task 2: Code Block Syntax Highlighting with highlight.js

**Files:**
- Modify: `package.json`
- Modify: `src/utils/markdown.ts`
- Modify: `src/index.css`

- [ ] **Step 1: Install highlight.js**

```bash
cd /d/code/js/project/person/learning && npm install highlight.js
```

- [ ] **Step 2: Update markdown.ts to integrate highlight.js**

Replace `src/utils/markdown.ts`:

```typescript
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';

marked.setOptions({
  breaks: true,
  gfm: true,
});

const renderer = new marked.Renderer();

renderer.code = function({ text, lang }: { text: string; lang?: string }) {
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
  const highlighted = hljs.highlight(text, { language }).value;
  return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
};

marked.use({ renderer });

export function renderMarkdown(markdown: string): string {
  const html = marked.parse(markdown) as string;
  return DOMPurify.sanitize(html);
}

export function isMarkdown(content: string): boolean {
  return /^#{1,6}\s/m.test(content) ||
    /\*\*.*\*\*/.test(content) ||
    /\[.*\]\(.*\)/.test(content) ||
    /^\s*[-*+]\s/m.test(content);
}
```

- [ ] **Step 3: Add highlight.js theme styles to index.css**

Add at the end of `src/index.css`:

```css
/* highlight.js theme */
.hljs {
  background: var(--bg-secondary);
  color: var(--text-primary);
}
.hljs-keyword,
.hljs-selector-tag,
.hljs-title,
.hljs-section,
.hljs-doctag,
.hljs-name,
.hljs-strong {
  font-weight: bold;
}
.hljs-comment {
  color: #6a9955;
}
.hljs-string,
.hljs-title.class_,
.hljs-attribute {
  color: #ce9178;
}
.hljs-number,
.hljs-symbol,
.hljs-bullet,
.hljs-link {
  color: #b5cea8;
}
.hljs-meta {
  color: #9b9b9b;
}
.hljs-deletion {
  color: #ce9178;
  background-color: #1e1e1e;
}
.hljs-addition {
  color: #b5cea8;
  background-color: #1e1e1e;
}
```

- [ ] **Step 4: Commit**

```bash
git add package.json src/utils/markdown.ts src/index.css
git commit -m "feat: add code syntax highlighting with highlight.js"
```

---

## Task 3: Help Panel for Keyboard Shortcuts

**Files:**
- Create: `src/components/HelpModal.tsx`
- Modify: `src/App.tsx:62-84`
- Modify: `src/components/Toolbar.tsx`

- [ ] **Step 1: Create HelpModal component**

```tsx
// src/components/HelpModal.tsx
interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { category: '文件操作', items: [
    { key: 'Ctrl+N', desc: '新建文件' },
    { key: 'Ctrl+O', desc: '打开文件' },
    { key: 'Ctrl+S', desc: '保存文件' },
  ]},
  { category: '编辑操作', items: [
    { key: 'Ctrl+B', desc: '加粗' },
    { key: 'Ctrl+I', desc: '斜体' },
    { key: 'Ctrl+K', desc: '插入链接' },
    { key: 'Ctrl+Z', desc: '撤销' },
    { key: 'Ctrl+Y', desc: '重做' },
  ]},
  { category: '视图操作', items: [
    { key: 'Ctrl+`', desc: '切换视图模式' },
    { key: 'Ctrl+/', desc: '源码模式' },
  ]},
];

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[var(--bg-secondary)] rounded-lg p-6 w-[500px] border border-[var(--border)] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>键盘快捷键</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-hover-bg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {shortcuts.map((section) => (
          <div key={section.category} className="mb-4">
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--accent)' }}>{section.category}</h3>
            <div className="space-y-1">
              {section.items.map((item) => (
                <div key={item.key} className="flex items-center justify-between py-1">
                  <span style={{ color: 'var(--text-secondary)' }}>{item.desc}</span>
                  <kbd className="px-2 py-1 rounded text-xs font-mono" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>{item.key}</kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add help button to Toolbar and update imports**

Modify `src/components/Toolbar.tsx`:

```tsx
import { useState } from 'react';
import { useEditor } from '../contexts/EditorContext';
import { useTheme } from '../hooks/useTheme';
import { HelpModal } from './HelpModal';

interface ToolbarProps {
  onNewFile: () => void;
  onSave: () => void;
}

export function Toolbar({ onNewFile, onSave }: ToolbarProps) {
  const { editor, setViewMode } = useEditor();
  const { theme, setTheme } = useTheme();
  const [showHelp, setShowHelp] = useState(false);

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
    <>
      <div className="px-4 py-2 flex items-center gap-3 border-b select-none" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <h1 className="text-base font-bold mr-4" style={{ color: 'var(--text-primary)' }}>Markdown Editor</h1>

        <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--border)' }} />

        <button onClick={() => setViewMode('wysiwyg')} className={editor.viewMode === 'wysiwyg' ? btnActive : btnSecondary} style={editor.viewMode === 'wysiwyg' ? {} : { color: 'var(--text-primary)' }}>
          预览
        </button>
        <button onClick={() => setViewMode('source')} className={editor.viewMode === 'source' ? btnActive : btnSecondary} style={editor.viewMode === 'source' ? {} : { color: 'var(--text-primary)' }}>
          源码
        </button>

        <div className="flex-1" />

        <button onClick={() => setShowHelp(true)} className={`${btnBase} hover:bg-hover-bg`} title="帮助">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <button onClick={cycleTheme} className={`${btnBase} hover:bg-hover-bg`} title={`主题: ${theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '跟随系统'}`}>
          {getThemeIcon()}
        </button>
      </div>
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
}
```

- [ ] **Step 3: Update App.tsx to add F1 shortcut for help**

Modify `src/App.tsx:62-84` - add F1 handler:

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      handleSave();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === '`') {
      e.preventDefault();
      setViewMode(editor.viewMode === 'wysiwyg' ? 'source' : 'wysiwyg');
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      handleNewFile();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
      e.preventDefault();
      handleOpenFile();
    }
    if (e.key === 'F1') {
      e.preventDefault();
      document.querySelector<HTMLButtonElement>('button[title="帮助"]')?.click();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [handleSave, handleNewFile, handleOpenFile, editor.viewMode, setViewMode]);
```

- [ ] **Step 4: Commit**

```bash
git add src/components/HelpModal.tsx src/components/Toolbar.tsx src/App.tsx
git commit -m "feat: add help modal with keyboard shortcuts (F1 or help button)"
```

---

## Task 4: Remove New/Save Buttons from Toolbar

**Files:**
- Modify: `src/components/Toolbar.tsx:45-87`
- Modify: `src/App.tsx:90-93`

- [ ] **Step 1: Remove New/Save buttons from Toolbar**

Modify `src/components/Toolbar.tsx:45-87` - remove these lines:
```tsx
<button onClick={onNewFile} className={btnSecondary} style={{ color: 'var(--text-primary)' }}>
  新建
</button>
<button onClick={onSave} className={btnSecondary} style={{ color: 'var(--text-primary)' }}>
  保存
</button>

<div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--border)' }} />
```

- [ ] **Step 2: Remove onNewFile and onSave props from Toolbar interface and usage**

Update `src/components/Toolbar.tsx`:

```tsx
interface ToolbarProps {
  // Removed: onNewFile: () => void;
  // Removed: onSave: () => void;
}

export function Toolbar() { // Removed parameters
```

And update `src/App.tsx:90-93`:

```tsx
<Toolbar /> // Changed from <Toolbar onNewFile={handleNewFile} onSave={handleSave} />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Toolbar.tsx src/App.tsx
git commit -m "refactor: remove New/Save buttons from toolbar (use Ctrl+N/S instead)"
```

---

## Task 5: Remember Last Opened Folder

**Files:**
- Modify: `src/components/Sidebar.tsx:107-119`
- Modify: `src/App.tsx` - load on mount

- [ ] **Step 1: Update Sidebar to save folder path to localStorage**

Modify `src/components/Sidebar.tsx:107-119` - add localStorage save:

```typescript
const handleOpenFolder = async () => {
  try {
    const { open } = await import('@tauri-apps/api/dialog');
    const selected = await open({ directory: true });
    if (selected && typeof selected === 'string') {
      setCurrentPath(selected);
      localStorage.setItem('lastOpenedFolder', selected);
      const tree = await readDirectory(selected);
      setFileTree(tree);
    }
  } catch (error) {
    console.error('打开文件夹失败:', error);
  }
};
```

- [ ] **Step 2: Add auto-open on App mount**

Modify `src/App.tsx` - add useEffect to auto-open last folder:

```typescript
useEffect(() => {
  const lastFolder = localStorage.getItem('lastOpenedFolder');
  if (lastFolder) {
    setCurrentPath(lastFolder);
    readDirectory(lastFolder).then(setFileTree).catch(console.error);
  }
}, []); // Empty deps - run once on mount
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Sidebar.tsx src/App.tsx
git commit -m "feat: remember last opened folder and auto-open on launch"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- File/folder CRUD: Task 1 ✅
- Code highlighting: Task 2 ✅
- Help panel: Task 3 ✅
- Remove toolbar buttons: Task 4 ✅
- Remember folder: Task 5 ✅

**2. Placeholder scan:** No TBD, TODO, or vague steps found.

**3. Type consistency:** All function names, paths, and interfaces are consistent across tasks.

---

## Execution Options

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?