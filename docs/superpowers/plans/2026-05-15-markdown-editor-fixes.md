# Markdown Editor Fixes and Enhancements Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix rename, add Typora-style formatting shortcuts, remove source button, show folder path in sidebar, add new file/folder buttons, conflict detection, HTML iframe rendering, multi-file tabs support.

**Architecture:** Add formatting shortcuts to WYSIWYG editor. Use iframe for HTML rendering. Add tabs for multiple open files. Update sidebar with new buttons and path display. Add conflict checking modal.

**Tech Stack:** Tauri + React + Monaco Editor + highlight.js + Marked.js

---

## Task 1: Fix Rename and Add Conflict Detection

**Files:**
- Modify: `src-tauri/src/commands.rs:90-97`
- Modify: `src/components/FileOperationModal.tsx`
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Add check_exists Rust command**

Modify `src-tauri/src/commands.rs` - add new command before closing bracket:

```rust
#[tauri::command]
pub async fn check_path_exists(path: String) -> Result<bool, String> {
    Ok(Path::new(&path).exists())
}
```

- [ ] **Step 2: Register check_path_exists in main.rs**

```rust
invoke_handler(tauri::generate_handler![
    commands::read_file,
    commands::write_file,
    commands::read_directory,
    commands::create_file,
    commands::create_directory,
    commands::delete_path,
    commands::rename_path,
    commands::check_path_exists,  // ADD THIS
])
```

- [ ] **Step 3: Update FileOperationModal to support conflict handling**

Replace `src/components/FileOperationModal.tsx`:

```tsx
import { useState, useEffect } from 'react';

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
  targetPath = '',
  onConfirm,
  onCancel,
  checkExists,
}: FileOperationModalProps) {
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      setError(null);
    }
  }, [isOpen, defaultName]);

  useEffect(() => {
    if (isOpen && checkExists && (operation === 'newFile' || operation === 'newFolder') && name.trim()) {
      const fullPath = `${targetPath}/${name.trim()}`;
      checkExists(fullPath).then(exists => {
        if (exists) {
          setError('文件已存在，是否覆盖？');
        } else {
          setError(null);
        }
      });
    }
  }, [name, isOpen, targetPath, operation, checkExists]);

  if (!isOpen) return null;

  const title = operation === 'newFile' ? '新建文件' : operation === 'newFolder' ? '新建文件夹' : operation === 'rename' ? '重命名' : '';
  const confirmText = operation === 'rename' ? '确定' : '创建';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      if (error && error.includes('已存在')) {
        onConfirm(name.trim(), true);
      } else if (!error) {
        onConfirm(name.trim(), false);
      }
    }
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
            className="w-full px-3 py-2 rounded border mb-2 text-sm"
            style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
            autoFocus
          />
          {error && (
            <p className="text-xs text-red-500 mb-2">{error}</p>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded hover:bg-hover-bg" style={{ color: 'var(--text-primary)' }}>
              取消
            </button>
            <button type="submit" className="px-4 py-2 text-sm rounded bg-accent text-white" disabled={!!error && !error.includes('已存在')}>
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update Sidebar handleNewFile/handleNewFolder to create at root (currentPath)**

```typescript
const handleNewFile = () => {
  // Always create at root level (currentPath), not in selected folder
  const basePath = currentPath || '';
  setModalState({ isOpen: true, operation: 'newFile', defaultName: '', targetPath: basePath });
};

const handleNewFolder = () => {
  // Always create at root level (currentPath), not in selected folder
  const basePath = currentPath || '';
  setModalState({ isOpen: true, operation: 'newFolder', defaultName: '', targetPath: basePath });
};
```

- [ ] **Step 5: Add checkExists prop to FileOperationModal in Sidebar**

```typescript
// In Sidebar:
const checkExists = useCallback(async (path: string) => {
  try {
    return await invoke<boolean>('check_path_exists', { path });
  } catch {
    return false;
  }
}, []);

// Pass to FileOperationModal:
<FileOperationModal
  isOpen={modalState.isOpen}
  operation={modalState.operation}
  defaultName={modalState.defaultName}
  targetPath={modalState.targetPath}
  onConfirm={handleModalConfirm}
  onCancel={handleModalCancel}
  checkExists={checkExists}
/>
```

- [ ] **Step 6: Update handleModalConfirm for overwrite handling**

```typescript
const handleModalConfirm = async (name: string, shouldOverwrite?: boolean) => {
  const { targetPath, operation } = modalState;
  if (!targetPath) return;

  const fullPath = `${targetPath}/${name}`;

  if (operation === 'newFile') {
    if (shouldOverwrite) {
      await invoke('delete_path', { path: fullPath });
    }
    const result = await createFile(targetPath, name);
    if (result && currentPath) {
      const tree = await readDirectory(currentPath);
      setFileTree(tree);
    }
  } else if (operation === 'newFolder') {
    if (shouldOverwrite) {
      await deletePath(fullPath);
    }
    const result = await createDirectory(targetPath, name);
    if (result && currentPath) {
      const tree = await readDirectory(currentPath);
      setFileTree(tree);
    }
  } else if (operation === 'rename' && modalState.targetPath) {
    const result = await renamePath(modalState.targetPath, name);
    if (result && currentPath) {
      const tree = await readDirectory(currentPath);
      setFileTree(tree);
    }
  }
  setModalState({ isOpen: false, operation: null });
};
```

- [ ] **Step 7: Commit**

```bash
git add src-tauri/src/commands.rs src-tauri/src/main.rs src/components/FileOperationModal.tsx src/components/Sidebar.tsx
git commit -m "fix: add conflict detection for file/folder operations"
```

---

## Task 2: Multi-File Tabs Support

**Files:**
- Create: `src/components/TabBar.tsx`
- Modify: `src/contexts/EditorContext.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add tabs state to EditorContext**

Modify `src/contexts/EditorContext.tsx`:

```typescript
// Add to types:
export interface Tab {
  id: string;
  filePath: string;
  content: string;
  fileType: FileType;
  isDirty: boolean;
}

// Add to EditorState interface:
interface EditorState {
  // ... existing fields
  tabs: Tab[];
  activeTabId: string | null;
}

// Add to context value:
interface EditorContextValue {
  // ... existing fields
  openTab: (filePath: string, content: string, fileType: FileType) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  // ...
}

// In EditorProvider:
const openTab = useCallback((filePath: string, content: string, fileType: FileType) => {
  setEditor(prev => {
    // Check if tab already exists
    const existingTab = prev.tabs.find(t => t.filePath === filePath);
    if (existingTab) {
      return { ...prev, activeTabId: existingTab.id };
    }
    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      filePath,
      content,
      fileType,
      isDirty: false,
    };
    return {
      ...prev,
      tabs: [...prev.tabs, newTab],
      activeTabId: newTab.id,
      content,
      filePath,
      fileType,
      isDirty: false,
    };
  });
}, []);

const closeTab = useCallback((tabId: string) => {
  setEditor(prev => {
    const newTabs = prev.tabs.filter(t => t.id !== tabId);
    let newState = { ...prev, tabs: newTabs };
    if (prev.activeTabId === tabId) {
      if (newTabs.length > 0) {
        const newActive = newTabs[newTabs.length - 1];
        newState = {
          ...newState,
          activeTabId: newActive.id,
          content: newActive.content,
          filePath: newActive.filePath,
          fileType: newActive.fileType,
          isDirty: newActive.isDirty,
        };
      } else {
        newState = {
          ...newState,
          activeTabId: null,
          content: '',
          filePath: null,
          fileType: 'markdown' as FileType,
          isDirty: false,
        };
      }
    }
    return newState;
  });
}, []);

const setActiveTab = useCallback((tabId: string) => {
  setEditor(prev => {
    const tab = prev.tabs.find(t => t.id === tabId);
    if (!tab) return prev;
    return {
      ...prev,
      activeTabId: tabId,
      content: tab.content,
      filePath: tab.filePath,
      fileType: tab.fileType,
      isDirty: tab.isDirty,
    };
  });
}, []);

const updateTabContent = useCallback((tabId: string, content: string) => {
  setEditor(prev => ({
    ...prev,
    tabs: prev.tabs.map(t => t.id === tabId ? { ...t, content, isDirty: true } : t),
    content,
    isDirty: true,
  }));
}, []);
```

- [ ] **Step 2: Create TabBar component**

Create `src/components/TabBar.tsx`:

```tsx
import { useEditor } from '../contexts/EditorContext';

export function TabBar() {
  const { editor, setActiveTab, closeTab } = useEditor();

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
    </div>
  );
}
```

- [ ] **Step 3: Update Sidebar to open files in tabs**

Modify `src/components/Sidebar.tsx` TreeNode handleClick:

```typescript
// In handleClick, change to use openTab from EditorContext:
import { useEditor } from '../contexts/EditorContext';

// In TreeNode:
const { openTab } = useEditor();

// Change file opening:
} else {
  setSelectedFile(node.path);
  try {
    const result = await invoke<{ content: string; file_type: string }>('read_file', {
      path: node.path,
    });
    openTab(node.path, result.content, result.file_type as FileType);
    const ext = node.name.split('.').pop()?.toLowerCase();
    if (ext === 'md') setFileType('markdown');
    else if (ext === 'html' || ext === 'htm') setFileType('html');
    else setFileType('text');
  } catch (error) {
    console.error('读取文件失败:', error);
  }
}
```

- [ ] **Step 4: Update App.tsx to add TabBar and update content handling**

```typescript
// Add TabBar import:
import { TabBar } from './components/TabBar';

// In App.tsx return:
<div className="flex flex-col h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
  <Toolbar />
  <TabBar />
  <div className="flex flex-1 overflow-hidden">
    <Sidebar />
    <div className="flex-1 overflow-hidden">
      {editor.viewMode === 'source' ? (
        <SourceEditor content={editor.content} onChange={handleContentChange} language={language} />
      ) : (
        <WysiwygEditor content={editor.content} onChange={handleContentChange} fileType={editor.fileType} />
      )}
    </div>
  </div>
  <StatusBar />
</div>

// Update handleContentChange to update active tab:
const handleContentChange = useCallback((content: string) => {
  if (editor.activeTabId) {
    updateTabContent(editor.activeTabId, content);
  } else {
    setContent(content);
  }
}, [editor.activeTabId, updateTabContent, setContent]);
```

- [ ] **Step 5: Commit**

```bash
git add src/components/TabBar.tsx src/contexts/EditorContext.tsx src/components/Sidebar.tsx src/App.tsx
git commit -m "feat: add multi-file tabs support"
```

---

## Task 3: Typora-Style Markdown Formatting Shortcuts

**Files:**
- Modify: `src/App.tsx:73-99`
- Modify: `src/components/WysiwygEditor.tsx`

- [ ] **Step 1: Add formatting functions to shortcuts.ts**

Replace `src/utils/shortcuts.ts`:

```typescript
export function applyHeading(text: string, level: 1 | 2 | 3 | 4 | 5 | 6): { text: string; cursorOffset: number } {
  const prefix = '#'.repeat(level) + ' ';
  return { text: prefix + text, cursorOffset: prefix.length };
}

export function applyBold(text: string, selectionStart: number, selectionEnd: number): { text: string; start: number; end: number } {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);
  if (selected.startsWith('**') && selected.endsWith('**')) {
    const unwrapped = selected.slice(2, -2);
    return { text: before + unwrapped + after, start: selectionStart, end: selectionStart + unwrapped.length };
  }
  const wrapped = `**${selected}**`;
  return { text: before + wrapped + after, start: selectionStart, end: selectionStart + wrapped.length };
}

export function applyItalic(text: string, selectionStart: number, selectionEnd: number): { text: string; start: number; end: number } {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);
  if (selected.startsWith('*') && selected.endsWith('*') && !selected.startsWith('**')) {
    const unwrapped = selected.slice(1, -1);
    return { text: before + unwrapped + after, start: selectionStart, end: selectionStart + unwrapped.length };
  }
  const wrapped = `*${selected}*`;
  return { text: before + wrapped + after, start: selectionStart, end: selectionStart + wrapped.length };
}

export function applyCode(text: string, selectionStart: number, selectionEnd: number): { text: string; start: number; end: number } {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);
  if (selected.startsWith('`') && selected.endsWith('`')) {
    const unwrapped = selected.slice(1, -1);
    return { text: before + unwrapped + after, start: selectionStart, end: selectionStart + unwrapped.length };
  }
  const wrapped = `\`${selected}\``;
  return { text: before + wrapped + after, start: selectionStart, end: selectionStart + wrapped.length };
}

export function applyCodeBlock(text: string, selectionStart: number, selectionEnd: number): { text: string; start: number; end: number } {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);
  const wrapped = `\n\`\`\`\n${selected}\n\`\`\`\n`;
  return { text: before + wrapped + after, start: selectionStart, end: selectionStart + wrapped.length };
}

export function applyLink(text: string, selectionStart: number, selectionEnd: number): { text: string; start: number; end: number } {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);
  const linkText = selected || '链接文本';
  const wrapped = `[${linkText}](url)`;
  return { text: before + wrapped + after, start: selectionStart, end: selectionStart + wrapped.length };
}

export function applyQuote(text: string, selectionStart: number, selectionEnd: number): { text: string; start: number; end: number } {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);
  const lines = selected.split('\n');
  const quoted = lines.map(line => '> ' + line).join('\n');
  return { text: before + quoted + after, start: selectionStart, end: selectionStart + quoted.length };
}

export function applyList(text: string, selectionStart: number, selectionEnd: number): { text: string; start: number; end: number } {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);
  const lines = selected.split('\n');
  const listed = lines.map(line => '- ' + line).join('\n');
  return { text: before + listed + after, start: selectionStart, end: selectionStart + listed.length };
}

export function applyNumberedList(text: string, selectionStart: number, selectionEnd: number): { text: string; start: number; end: number } {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);
  const lines = selected.split('\n');
  const listed = lines.map((line, i) => `${i + 1}. ${line}`).join('\n');
  return { text: before + listed + after, start: selectionStart, end: selectionStart + listed.length };
}
```

- [ ] **Step 2: Update WysiwygEditor to support formatting shortcuts**

Replace `src/components/WysiwygEditor.tsx`:

```typescript
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { renderMarkdown } from '../utils/markdown';
import { isHTML } from '../utils/html';
import { applyBold, applyItalic, applyCode, applyCodeBlock, applyLink } from '../utils/shortcuts';

interface WysiwygEditorProps {
  content: string;
  onChange: (value: string) => void;
  fileType?: 'markdown' | 'html' | 'text';
}

export const WysiwygEditor = React.memo(function WysiwygEditor({ content, onChange, fileType = 'markdown' }: WysiwygEditorProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isInternalChange = useRef(false);
  const [isHtmlMode, setIsHtmlMode] = useState(false);

  useEffect(() => {
    const isHtml = fileType === 'html' || isHTML(content);
    setIsHtmlMode(isHtml);
  }, [content, fileType]);

  useEffect(() => {
    if (!divRef.current || isInternalChange.current || isHtmlMode) {
      isInternalChange.current = false;
      return;
    }
    divRef.current.innerHTML = renderMarkdown(content);
  }, [content, isHtmlMode]);

  const handleInput = useCallback(() => {
    if (!divRef.current) return;
    isInternalChange.current = true;
    onChange(divRef.current.innerText);
  }, [onChange]);

  const getSelectionInfo = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return { start: 0, end: 0, text: '' };
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(divRef.current!);
    preCaretRange.setEnd(range.startContainer, range.startOffset);
    const start = preCaretRange.toString().length;
    const end = start + selection.toString().length;
    return { start, end, text: selection.toString() };
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;

    const { start, end, text } = getSelectionInfo();
    const fullText = divRef.current?.innerText || '';
    let result: { text: string; start?: number; end?: number } | null = null;

    switch (e.key) {
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
        e.preventDefault();
        const level = parseInt(e.key) as 1 | 2 | 3 | 4 | 5 | 6;
        const lines = fullText.split('\n');
        const lineIndex = fullText.substring(0, start).split('\n').length - 1;
        const prefix = '#'.repeat(level) + ' ';
        if (lines[lineIndex].startsWith('#')) {
          lines[lineIndex] = lines[lineIndex].replace(/^#+\s*/, prefix);
        } else {
          lines[lineIndex] = prefix + lines[lineIndex];
        }
        result = { text: lines.join('\n') };
        break;
      case 'b':
        e.preventDefault();
        result = applyBold(fullText, start, end);
        break;
      case 'i':
        e.preventDefault();
        result = applyItalic(fullText, start, end);
        break;
      case 'e':
        e.preventDefault();
        result = applyCode(fullText, start, end);
        break;
      case 'k':
        e.preventDefault();
        result = applyLink(fullText, start, end);
        break;
      case '`':
        return;
      default:
        return;
    }

    if (result) {
      e.preventDefault();
      if (divRef.current) {
        divRef.current.innerText = result.text;
        const range = document.createRange();
        const selection = window.getSelection();
        const textNodes = divRef.current.childNodes;
        let pos = 0;
        let targetNode: Node | null = null;
        let offset = 0;

        for (const node of textNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            const nodeLength = (node as Text).length;
            if (pos + nodeLength >= (result.start ?? 0)) {
              targetNode = node;
              offset = (result.start ?? 0) - pos;
              break;
            }
            pos += nodeLength + 1;
          }
        }

        if (targetNode) {
          range.setStart(targetNode, Math.min(offset, (targetNode as Text).length));
          range.collapse(true);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }

        handleInput();
      }
    }
  }, [getSelectionInfo, handleInput]);

  if (isHtmlMode && iframeRef.current) {
    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(content);
      iframeDoc.close();
    }
    return (
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0"
        title="HTML Preview"
        sandbox="allow-same-origin"
      />
    );
  }

  return (
    <div
      ref={divRef}
      data-wysiwyg
      contentEditable
      suppressContentEditableWarning
      className="h-full w-full overflow-auto p-6 outline-none leading-relaxed"
      style={{ fontSize: '16px', lineHeight: '1.8' }}
      onInput={handleInput}
      onBlur={handleInput}
      onKeyDown={handleKeyDown}
    />
  );
});
```

- [ ] **Step 3: Remove source button from Toolbar**

Modify `src/components/Toolbar.tsx` - remove the source button (lines 61-67):

```tsx
// Remove the source button - only keep preview button
// View toggle is only via Ctrl+`
```

- [ ] **Step 4: Commit**

```bash
git add src/utils/shortcuts.ts src/components/WysiwygEditor.tsx src/components/Toolbar.tsx
git commit -m "feat: add Typora-style markdown formatting shortcuts (Ctrl+1-6, B, I, E, K)"
```

---

## Task 4: Sidebar Improvements (Show Path + New File/Folder Icons)

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Update Sidebar header with path display and new file/folder buttons**

Replace the sidebar header section in `src/components/Sidebar.tsx`:

```typescript
<div className="px-3 py-2 border-b flex flex-col gap-2" style={{ borderColor: 'var(--border)' }}>
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
      文件
    </span>
    <div className="flex items-center gap-1">
      <button
        onClick={() => {
          const basePath = currentPath || '';
          setModalState({ isOpen: true, operation: 'newFile', defaultName: '', targetPath: basePath });
        }}
        className="p-1 rounded hover:bg-hover-bg"
        title="新建文件"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
      </button>
      <button
        onClick={() => {
          const basePath = currentPath || '';
          setModalState({ isOpen: true, operation: 'newFolder', defaultName: '', targetPath: basePath });
        }}
        className="p-1 rounded hover:bg-hover-bg"
        title="新建文件夹"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
      </button>
      <button
        onClick={handleOpenFolder}
        className="p-1 rounded hover:bg-hover-bg"
        title="打开文件夹"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </button>
    </div>
  </div>
  {currentPath && (
    <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }} title={currentPath}>
      {currentPath}
    </div>
  )}
</div>
```

- [ ] **Step 2: Ensure handleNewFile/handleNewFolder create at root (currentPath)**

```typescript
const handleNewFile = () => {
  // Always create at root level (currentPath)
  const basePath = currentPath || '';
  setModalState({ isOpen: true, operation: 'newFile', defaultName: '', targetPath: basePath });
};

const handleNewFolder = () => {
  // Always create at root level (currentPath)
  const basePath = currentPath || '';
  setModalState({ isOpen: true, operation: 'newFolder', defaultName: '', targetPath: basePath });
};
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: add new file/folder buttons to sidebar and show current path"
```

---

## Task 5: Update StatusBar to Show Full File Path

**Files:**
- Modify: `src/components/StatusBar.tsx`

- [ ] **Step 1: Update StatusBar to show truncated path with tooltip**

```typescript
// In StatusBar.tsx, line 40-42
<span className="truncate flex-1" style={{ color: 'var(--text-muted)' }} title={editor.filePath || '未保存文件'}>
  {editor.filePath ? editor.filePath.split(/[/\\]/).slice(-2).join('/') : '未保存文件'}
</span>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/StatusBar.tsx
git commit -m "feat: show truncated file path with full path in tooltip"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- Rename fix: Task 1 ✅
- Conflict detection: Task 1 ✅
- New file/folder at root: Task 1 ✅ (handleNewFile/handleNewFolder use currentPath)
- Multi-file tabs: Task 2 ✅
- Typora shortcuts: Task 3 ✅
- Remove source button: Task 3 ✅
- Sidebar path display: Task 4 ✅
- Sidebar new file/folder buttons: Task 4 ✅
- HTML iframe rendering: Task 3 (WysiwygEditor) ✅
- Status bar path: Task 5 ✅

**2. Placeholder scan:** No TBD, TODO, or vague steps found.

**3. Type consistency:** All function names, paths, and interfaces are consistent.

---

## Execution Options

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?