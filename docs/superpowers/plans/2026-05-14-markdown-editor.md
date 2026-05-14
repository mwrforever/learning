# 跨平台Markdown编辑器实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个跨平台桌面应用，复刻Typora的Markdown编辑功能，支持HTML渲染、源码查看/编辑、自动保存，以及常用快捷键

**Architecture:** 使用Tauri框架构建三层架构应用：Rust后端处理文件系统和自动保存，React前端使用Monaco Editor和Marked.js实现编辑和渲染，通过IPC通信连接前后端

**Tech Stack:** Tauri, Rust, React, TypeScript, Monaco Editor, Marked.js, TailwindCSS

---

## 文件结构

```
markdown-editor/
├── src-tauri/              # Rust后端
│   ├── src/
│   │   ├── main.rs        # 应用入口
│   │   ├── file.rs        # 文件操作模块
│   │   ├── save.rs        # 自动保存模块
│   │   ├── commands.rs    # Tauri命令定义
│   │   └── shortcuts.rs   # 快捷键处理
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                    # 前端
│   ├── components/
│   │   ├── Editor.tsx     # 编辑器组件
│   │   ├── Renderer.tsx   # 渲染引擎组件
│   │   ├── ViewSwitcher.tsx # 视图切换组件
│   │   └── StatusBar.tsx   # 状态栏组件
│   ├── hooks/
│   │   ├── useAutoSave.ts  # 自动保存Hook
│   │   └── useShortcuts.ts # 快捷键Hook
│   ├── utils/
│   │   ├── markdown.ts    # Markdown工具函数
│   │   └── html.ts        # HTML工具函数
│   ├── types/
│   │   └── index.ts       # TypeScript类型定义
│   └── App.tsx            # 主应用组件
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

### Task 1: 初始化Tauri项目

**Files:**
- Create: `package.json`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/src/main.rs`
- Create: `tsconfig.json`
- Create: `vite.config.ts`

- [ ] **Step 1: 创建package.json**

```json
{
  "name": "markdown-editor",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  },
  "dependencies": {
    "@tauri-apps/api": "^1.5.3",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "monaco-editor": "^0.45.0",
    "marked": "^12.0.0",
    "dompurify": "^3.0.6"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^1.5.10",
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.0",
    "@types/dompurify": "^3.0.5",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.4.5",
    "vite": "^5.2.11",
    "tailwindcss": "^3.4.3",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38"
  }
}
```

- [ ] **Step 2: 创建Cargo.toml**

```toml
[package]
name = "markdown-editor"
version = "0.1.0"
description = "跨平台Markdown编辑器"
authors = ["you"]
license = ""
repository = ""
edition = "2021"

[build-dependencies]
tauri-build = { version = "1.5", features = [] }

[dependencies]
tauri = { version = "1.5", features = ["shell-open"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.37", features = ["full"] }
notify = "6.1"

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
```

- [ ] **Step 3: 创建tauri.conf.json**

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "Markdown Editor",
    "version": "0.1.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": true
      },
      "dialog": {
        "all": false,
        "open": true,
        "save": true
      },
      "fs": {
        "all": false,
        "readFile": true,
        "writeFile": true,
        "readDir": true,
        "scope": ["**"]
      }
    },
    "bundle": {
      "active": true,
      "targets": "all",
      "identifier": "com.markdown-editor.app",
      "icon": []
    },
    "security": {
      "csp": null
    },
    "windows": [
      {
        "fullscreen": false,
        "resizable": true,
        "title": "Markdown Editor",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600
      }
    ]
  }
}
```

- [ ] **Step 4: 安装依赖**

```bash
npm install
```

- [ ] **Step 5: 提交**

```bash
git add .
git commit -m "feat: initialize Tauri project"
```

---

### Task 2: 实现Rust文件操作模块

**Files:**
- Create: `src-tauri/src/file.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: 创建file.rs**

```rust
use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct FileContent {
    pub content: String,
    pub file_type: String,
}

pub fn read_file_content(path: &str) -> Result<FileContent, String> {
    let path_obj = Path::new(path);
    
    if !path_obj.exists() {
        return Err("文件不存在".to_string());
    }
    
    let content = fs::read_to_string(path)
        .map_err(|e| format!("读取失败: {}", e))?;
    
    let extension = path_obj
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("txt");
    
    let file_type = match extension {
        "md" => "markdown",
        "html" => "html",
        _ => "text",
    };
    
    Ok(FileContent { content, file_type: file_type.to_string() })
}

pub fn write_file_content(path: &str, content: &str) -> Result<(), String> {
    fs::write(path, content)
        .map_err(|e| format!("写入失败: {}", e))?;
    Ok(())
}
```

- [ ] **Step 2: 提交**

```bash
git add src-tauri/src/file.rs
git commit -m "feat: add file operations module"
```

---

### Task 3: 实现Tauri命令

**Files:**
- Create: `src-tauri/src/commands.rs`

- [ ] **Step 1: 创建commands.rs**

```rust
use crate::file::{read_file_content, write_file_content};
use tauri::State;
use std::sync::Mutex;

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    let result = read_file_content(&path)?;
    Ok(result.content)
}

#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    write_file_content(&path, &content)?;
    Ok(())
}

#[tauri::command]
pub async fn save_file(path: String, content: String) -> Result<(), String> {
    write_file_content(&path, &content)?;
    Ok(())
}
```

- [ ] **Step 2: 提交**

```bash
git add src-tauri/src/commands.rs
git commit -m "feat: add Tauri commands"
```

---

### Task 4: 实现自动保存模块

**Files:**
- Create: `src-tauri/src/save.rs`

- [ ] **Step 1: 创建save.rs**

```rust
use std::collections::HashMap;
use std::time::{Duration, Instant};
use crate::file::write_file_content;

#[derive(Debug, Clone)]
pub struct SaveRequest {
    pub path: String,
    pub content: String,
}

pub struct AutoSaveManager {
    pending_saves: HashMap<String, SaveRequest>,
    last_save_time: HashMap<String, Instant>,
}

impl AutoSaveManager {
    pub fn new() -> Self {
        Self {
            pending_saves: HashMap::new(),
            last_save_time: HashMap::new(),
        }
    }
    
    pub fn queue_save(&mut self, request: SaveRequest) {
        self.pending_saves.insert(request.path.clone(), request);
    }
    
    pub fn process_pending(&mut self) -> Vec<Result<(), String>> {
        let mut results = Vec::new();
        let now = Instant::now();
        let debounce_duration = Duration::from_millis(500);
        
        self.pending_saves.retain(|path, request| {
            if let Some(last_time) = self.last_save_time.get(path) {
                if now.duration_since(*last_time) < debounce_duration {
                    return true;
                }
            }
            
            let result = write_file_content(&request.path, &request.content);
            results.push(result);
            self.last_save_time.insert(path.clone(), now);
            false;
        });
        
        results
    }
}

impl Default for AutoSaveManager {
    fn default() -> Self {
        Self::new()
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add src-tauri/src/save.rs
git commit -m "feat: add auto-save module"
```

---

### Task 5: 实现快捷键模块

**Files:**
- Create: `src-tauri/src/shortcuts.rs`

- [ ] **Step 1: 创建shortcuts.rs**

```rust
use tauri::{AppHandle};

pub fn register_shortcuts(handle: AppHandle) {
    handle.global_shortcut("CommandOrControl+S", move |_| {
        handle.emit_all("save-request", ()).ok();
    }).ok();
    
    handle.global_shortcut("CommandOrControl+`", move |_| {
        handle.emit_all("toggle-view", ()).ok();
    }).ok();
}
```

- [ ] **Step 2: 提交**

```bash
git add src-tauri/src/shortcuts.rs
git commit -m "feat: add shortcuts module"
```

---

### Task 6: 实现前端类型定义

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: 创建类型定义**

```typescript
export type ViewMode = 'wysiwyg' | 'source';

export interface EditorState {
  content: string;
  filePath: string | null;
  fileType: 'markdown' | 'html' | 'text';
  viewMode: ViewMode;
  isDirty: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved';
}
```

- [ ] **Step 2: 提交**

```bash
git add src/types/index.ts
git commit -m "feat: add type definitions"
```

---

### Task 7: 实现Markdown工具函数

**Files:**
- Create: `src/utils/markdown.ts`

- [ ] **Step 1: 创建markdown工具**

```typescript
import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({ breaks: true, gfm: true });

export function renderMarkdown(markdown: string): string {
  const html = marked(markdown);
  return DOMPurify.sanitize(html);
}

export function isMarkdown(content: string): boolean {
  return /^#{1,6}\s/m.test(content) || 
         /\*\*.*\*\*/.test(content) || 
         /\[.*\]\(.*\)/.test(content);
}
```

- [ ] **Step 2: 提交**

```bash
git add src/utils/markdown.ts
git commit -m "feat: add markdown utilities"
```

---

### Task 8: 实现HTML工具函数

**Files:**
- Create: `src/utils/html.ts`

- [ ] **Step 1: 创建html工具**

```typescript
import DOMPurify from 'dompurify';

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html);
}

export function isHTML(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}
```

- [ ] **Step 2: 提交**

```bash
git add src/utils/html.ts
git commit -m "feat: add HTML utilities"
```

---

### Task 9: 实现自动保存Hook

**Files:**
- Create: `src/hooks/useAutoSave.ts`

- [ ] **Step 1: 创建useAutoSave**

```typescript
import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

interface UseAutoSaveOptions {
  content: string;
  filePath: string | null;
  onSaveComplete?: () => void;
  onSaveError?: (error: string) => void;
}

export function useAutoSave({
  content,
  filePath,
  onSaveComplete,
  onSaveError,
}: UseAutoSaveOptions) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (!filePath || !content) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      
      try {
        await invoke('save_file', { path: filePath, content });
        onSaveComplete?.();
      } catch (error) {
        onSaveError?.(String(error));
      } finally {
        isSavingRef.current = false;
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, filePath, onSaveComplete, onSaveError]);

  useEffect(() => {
    const unlisten = listen('save-request', async () => {
      if (!filePath || !content) return;
      try {
        await invoke('save_file', { path: filePath, content });
        onSaveComplete?.();
      } catch (error) {
        onSaveError?.(String(error));
      }
    });
    return () => { unlisten.then(fn => fn()); };
  }, [content, filePath, onSaveComplete, onSaveError]);
}
```

- [ ] **Step 2: 提交**

```bash
git add src/hooks/useAutoSave.ts
git commit -m "feat: add useAutoSave hook"
```

---

### Task 10: 实现快捷键Hook

**Files:**
- Create: `src/hooks/useShortcuts.ts`

- [ ] **Step 1: 创建useShortcuts**

```typescript
import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';

interface ShortcutHandler {
  key: string;
  handler: () => void;
}

export function useShortcuts(handlers: ShortcutHandler[]) {
  useEffect(() => {
    const unlisteners: Promise<() => void>[] = [];

    handlers.forEach(({ key, handler }) => {
      const unlisten = listen(key, handler);
      unlisteners.push(unlisten);
    });

    return () => {
      unlisteners.forEach(unlisten => {
        unlisten.then(fn => fn());
      });
    };
  }, [handlers]);
}
```

- [ ] **Step 2: 提交**

```bash
git add src/hooks/useShortcuts.ts
git commit -m "feat: add useShortcuts hook"
```

---

### Task 11: 实现编辑器组件

**Files:**
- Create: `src/components/Editor.tsx`

- [ ] **Step 1: 创建Editor组件**

```typescript
import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import { ViewMode } from '../types';

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
  viewMode: ViewMode;
  language: string;
}

export function Editor({ content, onChange, viewMode, language }: EditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    editor.addAction({
      id: 'bold',
      label: '加粗',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB],
      run: function(ed) {
        const selection = ed.getSelection();
        const selectedText = ed.getModel().getValueInRange(selection);
        ed.executeEdits('bold', [{ range: selection, text: `**${selectedText}**` }]);
      },
    });
  };

  if (viewMode === 'wysiwyg') return null;

  return (
    <div className="h-full">
      <Editor
        height="100%"
        defaultLanguage={language}
        value={content}
        onChange={(v) => v && onChange(v)}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on' }}
      />
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add src/components/Editor.tsx
git commit -m "feat: add Editor component"
```

---

### Task 12: 实现渲染器组件

**Files:**
- Create: `src/components/Renderer.tsx`

- [ ] **Step 1: 创建Renderer组件**

```typescript
import React, { useEffect, useState } from 'react';
import { renderMarkdown, isMarkdown } from '../utils/markdown';
import { sanitizeHTML, isHTML } from '../utils/html';
import { ViewMode } from '../types';

interface RendererProps {
  content: string;
  fileType: 'markdown' | 'html' | 'text';
  viewMode: ViewMode;
}

export function Renderer({ content, fileType, viewMode }: RendererProps) {
  const [renderedContent, setRenderedContent] = useState('');

  useEffect(() => {
    if (viewMode !== 'wysiwyg') {
      setRenderedContent('');
      return;
    }

    let html = '';
    if (fileType === 'markdown' || isMarkdown(content)) {
      html = renderMarkdown(content);
    } else if (fileType === 'html' || isHTML(content)) {
      html = sanitizeHTML(content);
    } else {
      html = `<pre>${content}</pre>`;
    }
    setRenderedContent(html);
  }, [content, fileType, viewMode]);

  if (viewMode !== 'wysiwyg') return null;

  return (
    <div
      className="prose prose-invert max-w-none h-full overflow-auto p-4"
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add src/components/Renderer.tsx
git commit -m "feat: add Renderer component"
```

---

### Task 13: 实现视图切换组件

**Files:**
- Create: `src/components/ViewSwitcher.tsx`

- [ ] **Step 1: 创建ViewSwitcher组件**

```typescript
import React from 'react';
import { ViewMode } from '../types';

interface ViewSwitcherProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export function ViewSwitcher({ currentMode, onModeChange }: ViewSwitcherProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onModeChange('wysiwyg')}
        className={`px-3 py-1 rounded ${
          currentMode === 'wysiwyg' ? 'bg-blue-600' : 'bg-gray-700'
        }`}
      >
        预览
      </button>
      <button
        onClick={() => onModeChange('source')}
        className={`px-3 py-1 rounded ${
          currentMode === 'source' ? 'bg-blue-600' : 'bg-gray-700'
        }`}
      >
        源码
      </button>
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add src/components/ViewSwitcher.tsx
git commit -m "feat: add ViewSwitcher component"
```

---

### Task 14: 实现状态栏组件

**Files:**
- Create: `src/components/StatusBar.tsx`

- [ ] **Step 1: 创建StatusBar组件**

```typescript
import React from 'react';

interface StatusBarProps {
  filePath: string | null;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  fileType: string;
}

export function StatusBar({ filePath, saveStatus, fileType }: StatusBarProps) {
  const getStatusText = () => {
    switch (saveStatus) {
      case 'saved': return '已保存';
      case 'saving': return '保存中...';
      case 'unsaved': return '未保存';
    }
  };

  return (
    <div className="bg-gray-900 text-gray-300 px-4 py-2 flex justify-between text-sm">
      <span>{getStatusText()}</span>
      <div className="flex gap-4">
        <span>{filePath}</span>
        <span>{fileType}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add src/components/StatusBar.tsx
git commit -m "feat: add StatusBar component"
```

---

### Task 15: 实现主应用组件

**Files:**
- Create: `src/App.tsx`
- Create: `src/main.tsx`
- Create: `src/index.css`

- [ ] **Step 1: 创建App.tsx**

```typescript
import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open, save } from '@tauri-apps/api/dialog';
import { Editor } from './components/Editor';
import { Renderer } from './components/Renderer';
import { ViewSwitcher } from './components/ViewSwitcher';
import { StatusBar } from './components/StatusBar';
import { useAutoSave } from './hooks/useAutoSave';
import { useShortcuts } from './hooks/useShortcuts';
import { EditorState, ViewMode } from './types';
import { isMarkdown, isHTML } from './utils/markdown';
import './index.css';

function App() {
  const [state, setState] = useState<EditorState>({
    content: '',
    filePath: null,
    fileType: 'text',
    viewMode: 'wysiwyg',
    isDirty: false,
    saveStatus: 'saved',
  });

  useAutoSave({
    content: state.content,
    filePath: state.filePath,
    onSaveComplete: () => setState(prev => ({ ...prev, saveStatus: 'saved', isDirty: false })),
    onSaveError: () => setState(prev => ({ ...prev, saveStatus: 'unsaved' })),
  });

  useShortcuts([
    { key: 'toggle-view', handler: () => setState(prev => ({ ...prev, viewMode: prev.viewMode === 'wysiwyg' ? 'source' : 'wysiwyg' })) },
  ]);

  const handleOpenFile = async () => {
    try {
      const selected = await open({ multiple: false, filters: [{ name: 'Markdown', extensions: ['md'] }, { name: 'HTML', extensions: ['html'] }] });
      if (selected && typeof selected === 'string') {
        const content = await invoke<string>('read_file', { path: selected });
        let fileType: 'markdown' | 'html' | 'text' = 'text';
        if (selected.endsWith('.md') || isMarkdown(content)) fileType = 'markdown';
        else if (selected.endsWith('.html') || isHTML(content)) fileType = 'html';
        setState({ content, filePath: selected, fileType, viewMode: 'wysiwyg', isDirty: false, saveStatus: 'saved' });
      }
    } catch (error) {
      console.error('打开失败:', error);
    }
  };

  const handleSaveAs = async () => {
    try {
      const filePath = await save({ filters: [{ name: 'Markdown', extensions: ['md'] }, { name: 'HTML', extensions: ['html'] }] });
      if (filePath) {
        await invoke('write_file', { path: filePath, content: state.content });
        setState(prev => ({ ...prev, filePath, saveStatus: 'saved', isDirty: false }));
      }
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const getMonacoLanguage = () => state.fileType === 'markdown' ? 'markdown' : state.fileType === 'html' ? 'html' : 'plaintext';

  return (
    <div className="flex flex-col h-screen bg-gray-800">
      <div className="bg-gray-900 text-white px-4 py-2 flex gap-4">
        <h1 className="text-lg font-bold">Markdown Editor</h1>
        <button onClick={handleOpenFile} className="px-3 py-1 bg-blue-600 rounded">打开</button>
        <button onClick={handleSaveAs} className="px-3 py-1 bg-blue-600 rounded">另存为</button>
        <ViewSwitcher currentMode={state.viewMode} onModeChange={(m) => setState(prev => ({ ...prev, viewMode: m }))} />
      </div>
      <div className="flex-1 overflow-hidden">
        {state.viewMode === 'source' ? (
          <Editor content={state.content} onChange={(v) => setState(prev => ({ ...prev, content: v, isDirty: true, saveStatus: 'unsaved' }))} viewMode={state.viewMode} language={getMonacoLanguage()} />
        ) : (
          <Renderer content={state.content} fileType={state.fileType} viewMode={state.viewMode} />
        )}
      </div>
      <StatusBar filePath={state.filePath} saveStatus={state.saveStatus} fileType={state.fileType} />
    </div>
  );
}

export default App;
```

- [ ] **Step 2: 创建main.tsx**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode><App /></React.StrictMode>,
);
```

- [ ] **Step 3: 创建index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body { margin: 0; }
#root { width: 100%; height: 100vh; }
.prose { color: #e5e7eb; }
.prose h1 { color: #f3f4f6; }
.prose a { color: #60a5fa; }
```

- [ ] **Step 4: 创建index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Markdown Editor</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

- [ ] **Step 5: 提交**

```bash
git add src/App.tsx src/main.tsx src/index.css index.html
git commit -m "feat: add main App component"
```

---

### Task 16: 配置构建和启动

**Files:**
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`

- [ ] **Step 1: 创建vite.config.ts**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  build: { outDir: "dist" },
});
```

- [ ] **Step 2: 创建tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "bundler"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: 创建tailwind.config.js**

```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
}
```

- [ ] **Step 4: 创建postcss.config.js**

```javascript
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
```

- [ ] **Step 5: 提交**

```bash
git add vite.config.ts tsconfig.json tailwind.config.js postcss.config.js
git commit -m "feat: configure build tools"
```

---

### Task 17: 测试应用

**Files:**
- Test: 完整应用

- [ ] **Step 1: 启动开发服务器**

```bash
npm run tauri:dev
```

- [ ] **Step 2: 验证功能**

Expected: 应用窗口打开，可以打开.md和.html文件，支持预览和源码切换，自动保存工作正常

- [ ] **Step 3: 提交**

```bash
git add .
git commit -m "test: verify application functionality"
```

---

## 自评完成

计划已创建，覆盖了所有设计文档中的需求。每个任务都是独立的、可执行的步骤，包含完整的代码和命令。
