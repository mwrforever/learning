# Typora-Style Markdown Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a Typora-style markdown editor with dark/light theme, sidebar file tree, WYSIWYG + source view modes, and real-time rendering.

**Architecture:** React + TypeScript + TailwindCSS on frontend, Tauri + Rust on backend. WYSIWYG mode uses contenteditable div with marked.js rendering; source mode uses Monaco Editor. Theme system via CSS custom properties with system preference detection.

**Tech Stack:** React, TypeScript, TailwindCSS, Monaco Editor, marked.js, DOMPurify, Tauri

---

## File Structure

### New Files
- `src/components/Sidebar.tsx` - File tree sidebar with folder expand/collapse
- `src/hooks/useTheme.ts` - Theme state management (light/dark/system)
- `src/hooks/useFileTree.ts` - File tree operations (read directory, build tree)
- `src/contexts/EditorContext.tsx` - Global editor state (content, filePath, viewMode, theme)
- `src/styles/theme.css` - CSS variables for light/dark themes

### Files to Modify
- `src/App.tsx` - Rewrite for new layout: toolbar + sidebar + editor + statusbar
- `src/components/Toolbar.tsx` - Add theme toggle buttons
- `src/components/StatusBar.tsx` - Minor layout adjustments
- `src/index.css` - Remove hardcoded styles, use theme CSS variables
- `tailwind.config.js` - Add theme color tokens

---

## Task 1: Theme System

**Files:**
- Create: `src/styles/theme.css`
- Create: `src/hooks/useTheme.ts`
- Modify: `src/index.css`
- Modify: `tailwind.config.js`

- [ ] **Step 1: Create theme CSS variables**

Create `src/styles/theme.css`:
```css
/* Light theme (default) */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f7f7f7;
  --bg-sidebar: #f5f5f5;
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-muted: #999999;
  --border: #e0e0e0;
  --accent: #7C3AED;
  --hover-bg: #eeeeee;
  --scrollbar-track: #f1f1f1;
  --scrollbar-thumb: #c1c1c1;
}

/* Dark theme */
.dark {
  --bg-primary: #1a1a1a;
  --bg-secondary: #252525;
  --bg-sidebar: #222222;
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0a0;
  --text-muted: #707070;
  --border: #3a3a3a;
  --accent: #7C3AED;
  --hover-bg: #333333;
  --scrollbar-track: #2a2a2a;
  --scrollbar-thumb: #555555;
}
```

- [ ] **Step 2: Update tailwind.config.js to use CSS variables**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'var(--bg-primary)',
        secondary: 'var(--bg-secondary)',
        sidebar: 'var(--bg-sidebar)',
        accent: 'var(--accent)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        border: 'var(--border)',
        'hover-bg': 'var(--hover-bg)',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 3: Create useTheme hook**

Create `src/hooks/useTheme.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('theme');
    return (stored as ThemeMode) || 'system';
  });

  const applyTheme = useCallback((mode: ThemeMode) => {
    const root = document.documentElement;
    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', mode === 'dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    applyTheme(theme);
  }, [theme, applyTheme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme, applyTheme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  }, []);

  return { theme, setTheme, toggleTheme };
}
```

- [ ] **Step 4: Update index.css to use theme variables**

Replace `src/index.css` content with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import './styles/theme.css';

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

#root {
  width: 100%;
  height: 100vh;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* WYSIWYG editor content styles */
[data-wysiwyg] {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

[data-wysiwyg] h1,
[data-wysiwyg] h2,
[data-wysiwyg] h3,
[data-wysiwyg] h4,
[data-wysiwyg] h5,
[data-wysiwyg] h6 {
  color: var(--text-primary);
  font-weight: 700;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

[data-wysiwyg] h1 { font-size: 2em; }
[data-wysiwyg] h2 { font-size: 1.5em; }
[data-wysiwyg] h3 { font-size: 1.25em; }

[data-wysiwyg] p {
  margin-bottom: 1em;
}

[data-wysiwyg] a {
  color: var(--accent);
  text-decoration: underline;
}

[data-wysiwyg] strong {
  font-weight: 700;
}

[data-wysiwyg] em {
  font-style: italic;
}

[data-wysiwyg] code {
  background: var(--bg-secondary);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 0.9em;
}

[data-wysiwyg] pre {
  background: var(--bg-secondary);
  padding: 1em;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1em 0;
}

[data-wysiwyg] pre code {
  background: transparent;
  padding: 0;
}

[data-wysiwyg] ul,
[data-wysiwyg] ol {
  margin-left: 1.5em;
  margin-bottom: 1em;
}

[data-wysiwyg] li {
  margin-bottom: 0.25em;
}

[data-wysiwyg] blockquote {
  border-left: 4px solid var(--border);
  padding-left: 1em;
  margin-left: 0;
  font-style: italic;
}

[data-wysiwyg] hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 2em 0;
}

[data-wysiwyg] img {
  max-width: 100%;
  border-radius: 8px;
}

[data-wysiwyg] table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

[data-wysiwyg] th,
[data-wysiwyg] td {
  border: 1px solid var(--border);
  padding: 0.5em;
  text-align: left;
}

[data-wysiwyg] th {
  background: var(--bg-secondary);
  font-weight: 600;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/styles/theme.css src/hooks/useTheme.ts src/index.css tailwind.config.js
git commit -m "feat: add theme system with CSS variables and useTheme hook"
```

---

## Task 2: EditorContext

**Files:**
- Create: `src/contexts/EditorContext.tsx`
- Modify: `src/types/index.ts` (add FileTreeNode type)

- [ ] **Step 1: Add FileTreeNode type to types**

Add to `src/types/index.ts`:
```typescript
export interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeNode[];
}
```

- [ ] **Step 2: Create EditorContext**

Create `src/contexts/EditorContext.tsx`:
```typescript
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ViewMode, FileType, SaveStatus, FileTreeNode } from '../types';

interface EditorState {
  content: string;
  filePath: string | null;
  fileType: FileType;
  viewMode: ViewMode;
  isDirty: boolean;
  saveStatus: SaveStatus;
}

interface SidebarState {
  currentPath: string | null;
  fileTree: FileTreeNode[];
  expandedFolders: Set<string>;
  selectedFile: string | null;
}

interface EditorContextValue {
  editor: EditorState;
  sidebar: SidebarState;
  setContent: (content: string) => void;
  setFilePath: (path: string | null) => void;
  setFileType: (type: FileType) => void;
  setViewMode: (mode: ViewMode) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setIsDirty: (dirty: boolean) => void;
  setCurrentPath: (path: string | null) => void;
  setFileTree: (tree: FileTreeNode[]) => void;
  toggleFolder: (path: string) => void;
  setSelectedFile: (path: string | null) => void;
  resetEditor: () => void;
}

const initialEditorState: EditorState = {
  content: '',
  filePath: null,
  fileType: 'markdown',
  viewMode: 'wysiwyg',
  isDirty: false,
  saveStatus: 'saved',
};

const initialSidebarState: SidebarState = {
  currentPath: null,
  fileTree: [],
  expandedFolders: new Set(),
  selectedFile: null,
};

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [editor, setEditor] = useState<EditorState>(initialEditorState);
  const [sidebar, setSidebar] = useState<SidebarState>(initialSidebarState);

  const setContent = useCallback((content: string) => {
    setEditor((prev) => ({ ...prev, content, isDirty: true }));
  }, []);

  const setFilePath = useCallback((filePath: string | null) => {
    setEditor((prev) => ({ ...prev, filePath }));
  }, []);

  const setFileType = useCallback((fileType: FileType) => {
    setEditor((prev) => ({ ...prev, fileType }));
  }, []);

  const setViewMode = useCallback((viewMode: ViewMode) => {
    setEditor((prev) => ({ ...prev, viewMode }));
  }, []);

  const setSaveStatus = useCallback((saveStatus: SaveStatus) => {
    setEditor((prev) => ({ ...prev, saveStatus }));
  }, []);

  const setIsDirty = useCallback((isDirty: boolean) => {
    setEditor((prev) => ({ ...prev, isDirty }));
  }, []);

  const setCurrentPath = useCallback((currentPath: string | null) => {
    setSidebar((prev) => ({ ...prev, currentPath }));
  }, []);

  const setFileTree = useCallback((fileTree: FileTreeNode[]) => {
    setSidebar((prev) => ({ ...prev, fileTree }));
  }, []);

  const toggleFolder = useCallback((path: string) => {
    setSidebar((prev) => {
      const newExpanded = new Set(prev.expandedFolders);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return { ...prev, expandedFolders: newExpanded };
    });
  }, []);

  const setSelectedFile = useCallback((selectedFile: string | null) => {
    setSidebar((prev) => ({ ...prev, selectedFile }));
  }, []);

  const resetEditor = useCallback(() => {
    setEditor(initialEditorState);
  }, []);

  return (
    <EditorContext.Provider
      value={{
        editor,
        sidebar,
        setContent,
        setFilePath,
        setFileType,
        setViewMode,
        setSaveStatus,
        setIsDirty,
        setCurrentPath,
        setFileTree,
        toggleFolder,
        setSelectedFile,
        resetEditor,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/contexts/EditorContext.tsx src/types/index.ts
git commit -m "feat: add EditorContext for global state management"
```

---

## Task 3: Sidebar Component

**Files:**
- Create: `src/components/Sidebar.tsx`
- Create: `src/hooks/useFileTree.ts`
- Modify: `src-tauri/src/commands.rs` (add read_directory command)
- Modify: `src-tauri/src/main.rs` or `lib.rs` (register command)

- [ ] **Step 1: Read existing Rust commands**

Read `src-tauri/src/lib.rs` or `commands.rs` to understand current command structure.

- [ ] **Step 2: Create useFileTree hook**

Create `src/hooks/useFileTree.ts`:
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
          if (a.isDirectory !== b.isDirectory) {
            return a.isDirectory ? -1 : 1;
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
```

- [ ] **Step 3: Add read_directory command to Rust backend**

Read your Rust source file first, then add:
```rust
#[tauri::command]
pub async fn read_directory(path: String) -> Result<Vec<DirectoryEntry>, String> {
    let mut entries: Vec<DirectoryEntry> = Vec::new();
    let mut dir = tokio::fs::read_dir(&path)
        .await
        .map_err(|e| e.to_string())?;

    while let Some(item) = dir.next_entry().await.map_err(|e| e.to_string())? {
        let metadata = item.metadata().await.map_err(|e| e.to_string())?;
        entries.push(DirectoryEntry {
            name: item.file_name().to_string_lossy().to_string(),
            path: item.path().to_string_lossy().to_string(),
            is_directory: metadata.is_dir(),
        });
    }

    Ok(entries)
}
```

- [ ] **Step 4: Create Sidebar component**

Create `src/components/Sidebar.tsx`:
```typescript
import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useEditor } from '../contexts/EditorContext';
import { useFileTree } from '../hooks/useFileTree';
import { FileTreeNode } from '../types';

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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

interface TreeNodeProps {
  node: FileTreeNode;
  level: number;
}

function TreeNode({ node, level }: TreeNodeProps) {
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
        const result = await invoke<{ content: string; file_type: string }>('read_file', {
          path: node.path,
        });
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
        className={`flex items-center gap-1 px-2 py-1 cursor-pointer rounded ${
          isSelected ? 'bg-accent/20 text-accent' : 'hover:bg-hover-bg'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {node.isDirectory ? (
          <FolderIcon isOpen={isExpanded} />
        ) : (
          <FileIcon name={node.name} />
        )}
        <span className="text-sm truncate">{node.name}</span>
      </div>
      {node.isDirectory && isExpanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <TreeNode key={child.path} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { sidebar, setCurrentPath, setFileTree } = useEditor();
  const { readDirectory } = useFileTree();

  const handleOpenFolder = async () => {
    try {
      const { open } = await import('@tauri-apps/api/dialog');
      const selected = await open({ directory: true });
      if (selected && typeof selected === 'string') {
        setCurrentPath(selected);
        const tree = await readDirectory(selected);
        setFileTree(tree);
      }
    } catch (error) {
      console.error('打开文件夹失败:', error);
    }
  };

  return (
    <div
      className="w-56 h-full flex flex-col border-r overflow-hidden"
      style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}
    >
      <div
        className="px-3 py-2 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          文件
        </span>
        <button
          onClick={handleOpenFolder}
          className="p-1 rounded hover:bg-hover-bg"
          title="打开文件夹"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {sidebar.fileTree.map((node) => (
          <TreeNode key={node.path} node={node} level={0} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useFileTree.ts src/components/Sidebar.tsx
git commit -m "feat: add Sidebar component with file tree"
```

---

## Task 4: Toolbar with Theme Toggle

**Files:**
- Modify: `src/components/Toolbar.tsx`

- [ ] **Step 1: Rewrite Toolbar with theme toggle**

Replace `src/components/Toolbar.tsx` with:
```typescript
import { ViewMode } from '../types';
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Toolbar.tsx
git commit -m "feat: update Toolbar with theme toggle support"
```

---

## Task 5: Rewrite App.tsx with New Layout

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/hooks/useAutoSave.ts`

- [ ] **Step 1: Update useAutoSave to work with EditorContext**

Read `src/hooks/useAutoSave.ts`, then update to use EditorContext or pass callbacks:

```typescript
import { useRef, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

interface UseAutoSaveOptions {
  content: string;
  filePath: string | null;
  onSaving: () => void;
  onSaved: () => void;
  onError: () => void;
}

export function useAutoSave({ content, filePath, onSaving, onSaved, onError }: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef(content);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const saveImmediately = useCallback(async () => {
    if (!filePath) return;
    try {
      onSaving();
      await invoke('write_file', { path: filePath, content: contentRef.current });
      onSaved();
    } catch (error) {
      console.error('保存失败:', error);
      onError();
    }
  }, [filePath, onSaving, onSaved, onError]);

  useEffect(() => {
    if (!filePath) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveImmediately();
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, filePath, saveImmediately]);

  return { saveImmediately };
}
```

- [ ] **Step 2: Rewrite App.tsx**

Replace `src/App.tsx` with:
```typescript
import { useCallback, useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { SourceEditor } from './components/SourceEditor';
import { WysiwygEditor } from './components/WysiwygEditor';
import { StatusBar } from './components/StatusBar';
import { EditorProvider, useEditor } from './contexts/EditorContext';
import { useAutoSave } from './hooks/useAutoSave';

function EditorContent() {
  const { editor, setContent, setViewMode, setSaveStatus, resetEditor } = useEditor();

  const { saveImmediately } = useAutoSave({
    content: editor.content,
    filePath: editor.filePath,
    onSaving: () => setSaveStatus('saving'),
    onSaved: () => setSaveStatus('saved'),
    onError: () => setSaveStatus('unsaved'),
  });

  const handleNewFile = useCallback(() => {
    resetEditor();
  }, [resetEditor]);

  const handleSave = useCallback(async () => {
    if (editor.filePath) {
      await saveImmediately();
    }
  }, [editor.filePath, saveImmediately]);

  const handleContentChange = useCallback((content: string) => {
    setContent(content);
  }, [setContent]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
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
  }, [handleSave, handleNewFile, setViewMode, editor.viewMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const language = editor.fileType === 'markdown' ? 'markdown' : editor.fileType === 'html' ? 'html' : 'plaintext';

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Toolbar onNewFile={handleNewFile} onSave={handleSave} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-hidden">
          {editor.viewMode === 'source' ? (
            <SourceEditor content={editor.content} onChange={handleContentChange} language={language} />
          ) : (
            <WysiwygEditor content={editor.content} onChange={handleContentChange} />
          )}
        </div>
      </div>
      <StatusBar
        filePath={editor.filePath}
        saveStatus={editor.saveStatus}
        fileType={editor.fileType}
        wordCount={editor.content.length}
      />
    </div>
  );
}

function App() {
  return (
    <EditorProvider>
      <EditorContent />
    </EditorProvider>
  );
}

export default App;
```

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx src/hooks/useAutoSave.ts
git commit -m "feat: rewrite App.tsx with new layout and EditorContext"
```

---

## Task 6: Update StatusBar for Theme

**Files:**
- Modify: `src/components/StatusBar.tsx`

- [ ] **Step 1: Update StatusBar to use theme variables**

Replace `src/components/StatusBar.tsx` with:
```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/StatusBar.tsx
git commit -m "feat: update StatusBar with theme-aware styling"
```

---

## Task 7: Update Monaco Editor Theme

**Files:**
- Modify: `src/components/SourceEditor.tsx`

- [ ] **Step 1: Update Monaco theme to match app theme**

Update Monaco's `theme` prop and add theme change listener:

```typescript
import React, { useRef, useCallback, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { toggleBold, toggleItalic, insertLink } from '../utils/shortcuts';

interface SourceEditorProps {
  content: string;
  onChange: (value: string) => void;
  language: string;
}

const lightTheme = {
  base: 'vs' as const,
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#333333',
  },
};

const darkTheme = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#1a1a1a',
    'editor.foreground': '#e0e0e0',
  },
};

export const SourceEditor = React.memo(function SourceEditor({ content, onChange, language }: SourceEditorProps) {
  const editorRef = useRef<any>(null);

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    monaco.editor.defineTheme('custom-light', lightTheme);
    monaco.editor.defineTheme('custom-dark', darkTheme);

    const isDark = document.documentElement.classList.contains('dark');
    monaco.editor.setTheme(isDark ? 'custom-dark' : 'custom-light');

    const observer = new MutationObserver(() => {
      const isDarkNow = document.documentElement.classList.contains('dark');
      monaco.editor.setTheme(isDarkNow ? 'custom-dark' : 'custom-light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Add keyboard shortcuts
    editor.addAction({
      id: 'markdown-bold',
      label: '加粗',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB],
      run: (ed) => {
        const model = ed.getModel();
        const selection = ed.getSelection();
        const start = model.getOffsetAt(selection.getStartPosition());
        const end = model.getOffsetAt(selection.getEndPosition());
        const text = model.getValue();
        const result = toggleBold(text, start, end);
        model.setValue(result.text);
        ed.setSelection(new monaco.Selection(
          model.getPositionAt(result.start).lineNumber,
          model.getPositionAt(result.start).column,
          model.getPositionAt(result.end).lineNumber,
          model.getPositionAt(result.end).column
        ));
      },
    });

    editor.addAction({
      id: 'markdown-italic',
      label: '斜体',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI],
      run: (ed) => {
        const model = ed.getModel();
        const selection = ed.getSelection();
        const start = model.getOffsetAt(selection.getStartPosition());
        const end = model.getOffsetAt(selection.getEndPosition());
        const text = model.getValue();
        const result = toggleItalic(text, start, end);
        model.setValue(result.text);
        ed.setSelection(new monaco.Selection(
          model.getPositionAt(result.start).lineNumber,
          model.getPositionAt(result.start).column,
          model.getPositionAt(result.end).lineNumber,
          model.getPositionAt(result.end).column
        ));
      },
    });

    editor.addAction({
      id: 'markdown-link',
      label: '插入链接',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
      run: (ed) => {
        const model = ed.getModel();
        const selection = ed.getSelection();
        const start = model.getOffsetAt(selection.getStartPosition());
        const end = model.getOffsetAt(selection.getEndPosition());
        const text = model.getValue();
        const result = insertLink(text, start, end);
        model.setValue(result.text);
        ed.setSelection(new monaco.Selection(
          model.getPositionAt(result.start).lineNumber,
          model.getPositionAt(result.start).column,
          model.getPositionAt(result.end).lineNumber,
          model.getPositionAt(result.end).column
        ));
      },
    });
  }, []);

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={language}
        value={content}
        onChange={(v) => v !== undefined && onChange(v)}
        onMount={handleMount}
        theme="custom-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          padding: { top: 16 },
        }}
      />
    </div>
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SourceEditor.tsx
git commit -m "feat: update Monaco Editor theme to match app theme"
```

---

## Task 8: Update WysiwygEditor for Theme

**Files:**
- Modify: `src/components/WysiwygEditor.tsx`

- [ ] **Step 1: Update WysiwygEditor styling to use CSS variables**

```typescript
// In WysiwygEditor.tsx, update className to remove hardcoded colors
className="h-full w-full overflow-auto p-6 outline-none leading-relaxed"
// Remove bg-gray-800 text-gray-100 since we use CSS variables in index.css
```

- [ ] **Step 2: Commit**

```bash
git add src/components/WysiwygEditor.tsx
git commit -m "feat: update WysiwygEditor to use theme CSS variables"
```

---

## Verification Checklist

After all tasks complete, verify:

- [ ] Theme toggles between light/dark/system
- [ ] Sidebar shows file tree when folder is opened
- [ ] Clicking folder expands/collapses
- [ ] Clicking .md file opens in editor with Markdown mode
- [ ] Clicking .html file opens in editor with HTML mode
- [ ] WYSIWYG mode renders Markdown correctly
- [ ] Source mode shows code in Monaco Editor
- [ ] Ctrl+` toggles between views
- [ ] StatusBar shows correct file info
- [ ] Theme persists across page reloads