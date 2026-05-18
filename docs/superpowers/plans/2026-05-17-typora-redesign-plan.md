# Typora 完全重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有Markdown编辑器完全重构为Typora风格的WYSIWYG编辑器

**Architecture:** 使用contenteditable div实现真正WYSIWYG编辑，替代当前的Monaco Editor + 源码模式分离架构。核心思路是保留Markdown源码在内存中，只在编辑器的特定位置进行"原地渲染"。

**Tech Stack:** Tauri + React + TypeScript + TailwindCSS + marked.js + DOMPurify

---

## 文件结构

```
src/
├── components/
│   ├── MenuBar.tsx          # 新增: Typora风格菜单栏
│   ├── DockBar.tsx          # 新增: 格式工具栏
│   ├── Sidebar.tsx          # 修改: 文件树组件
│   ├── WysiwygEditor.tsx    # 重写: WYSIWYG编辑引擎
│   ├── TabBar.tsx           # 现有组件
│   └── StatusBar.tsx        # 现有组件
├── contexts/
│   └── EditorContext.tsx    # 扩展: 支持source mode
├── hooks/
│   ├── useMarkdownInput.ts  # 新增: Markdown输入处理
│   ├── useAutoSave.ts       # 现有组件
│   ├── useFileTree.ts       # 现有组件
│   └── useShortcuts.ts      # 重写: 快捷键系统
├── utils/
│   ├── markdown.ts          # 扩展: 双向转换
│   ├── shortcuts.ts         # 现有组件
│   └── dom.ts               # 新增: DOM操作工具
└── App.tsx                  # 重写: 主应用布局
```

---

## Phase 1: 基础架构

### Task 1: 清理旧组件，准备基础架构

**Files:**
- Delete: `src/components/Toolbar.tsx` (将被MenuBar+DockBar替代)
- Modify: `src/App.tsx` (重写布局)
- Modify: `src/styles/theme.css` (添加Typora风格样式)

- [ ] **Step 1: 删除旧Toolbar**

```bash
rm src/components/Toolbar.tsx
```

- [ ] **Step 2: 确认 App.tsx 备份内容存在**

检查当前App.tsx结构，为重写做准备

- [ ] **Step 3: 提交**

```bash
git add . && git commit -m "refactor: remove old Toolbar for MenuBar+DockBar rewrite"
```

---

### Task 2: 创建 MenuBar 菜单栏组件

**Files:**
- Create: `src/components/MenuBar.tsx`

```typescript
import { useState } from 'react';
import { useEditor } from '../contexts/EditorContext';

interface MenuItem {
  label: string;
  action?: () => void;
  shortcut?: string;
  divider?: boolean;
}

interface Menu {
  label: string;
  items: MenuItem[];
}

export function MenuBar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { editor } = useEditor();

  const menus: Menu[] = [
    {
      label: 'File',
      items: [
        { label: 'New', action: () => {}, shortcut: 'Ctrl+N' },
        { label: 'Open', action: () => {}, shortcut: 'Ctrl+O' },
        { divider: true, label: '' },
        { label: 'Save', action: () => {}, shortcut: 'Ctrl+S' },
        { label: 'Save As...', action: () => {}, shortcut: 'Ctrl+Shift+S' },
        { divider: true, label: '' },
        { label: 'Exit', action: () => window.close() },
      ],
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', action: () => document.execCommand('undo'), shortcut: 'Ctrl+Z' },
        { label: 'Redo', action: () => document.execCommand('redo'), shortcut: 'Ctrl+Y' },
        { divider: true, label: '' },
        { label: 'Cut', action: () => document.execCommand('cut'), shortcut: 'Ctrl+X' },
        { label: 'Copy', action: () => document.execCommand('copy'), shortcut: 'Ctrl+C' },
        { label: 'Paste', action: () => document.execCommand('paste'), shortcut: 'Ctrl+V' },
        { divider: true, label: '' },
        { label: 'Find', action: () => {}, shortcut: 'Ctrl+F' },
        { label: 'Replace', action: () => {}, shortcut: 'Ctrl+H' },
      ],
    },
    {
      label: 'Paragraph',
      items: [
        { label: 'Heading 1', action: () => {}, shortcut: 'Ctrl+1' },
        { label: 'Heading 2', action: () => {}, shortcut: 'Ctrl+2' },
        { label: 'Heading 3', action: () => {}, shortcut: 'Ctrl+3' },
        { label: 'Heading 4', action: () => {}, shortcut: 'Ctrl+4' },
        { divider: true, label: '' },
        { label: 'Quote', action: () => {}, shortcut: 'Ctrl+Shift+Q' },
        { label: 'Bullet List', action: () => {}, shortcut: 'Ctrl+Shift+U' },
        { label: 'Numbered List', action: () => {}, shortcut: 'Ctrl+Shift+O' },
      ],
    },
    {
      label: 'Format',
      items: [
        { label: 'Bold', action: () => {}, shortcut: 'Ctrl+B' },
        { label: 'Italic', action: () => {}, shortcut: 'Ctrl+I' },
        { label: 'Underline', action: () => {}, shortcut: 'Ctrl+U' },
        { label: 'Strikethrough', action: () => {} },
        { label: 'Code', action: () => {}, shortcut: 'Ctrl+`' },
        { label: 'Link', action: () => {}, shortcut: 'Ctrl+K' },
      ],
    },
    {
      label: 'View',
      items: [
        { label: 'Toggle Sidebar', action: () => {}, shortcut: 'Ctrl+' },
        { label: 'Source Mode', action: () => {}, shortcut: 'Ctrl+`' },
        { divider: true, label: '' },
        { label: 'Focus Mode', action: () => {} },
      ],
    },
    {
      label: 'Theme',
      items: [
        { label: 'Light', action: () => {} },
        { label: 'Dark', action: () => {} },
        { label: 'Solarized', action: () => {} },
      ],
    },
  ];

  return (
    <div
      className="h-8 flex items-center border-b select-none"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
    >
      {menus.map((menu) => (
        <div key={menu.label} className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === menu.label ? null : menu.label)}
            onBlur={() => setTimeout(() => setOpenMenu(null), 150)}
            className="px-3 py-1 text-sm hover:bg-hover-bg"
            style={{ color: 'var(--text-primary)' }}
          >
            {menu.label}
          </button>
          {openMenu === menu.label && (
            <div
              className="absolute top-full left-0 min-w-40 py-1 rounded shadow-lg z-50"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border)', borderWidth: 1 }}
            >
              {menu.items.map((item, i) =>
                item.divider ? (
                  <div key={i} className="border-b my-1" style={{ borderColor: 'var(--border)' }} />
                ) : (
                  <button
                    key={i}
                    onClick={item.action}
                    className="w-full px-4 py-1 text-sm text-left hover:bg-hover-bg flex justify-between"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="ml-4 opacity-60" style={{ fontSize: '11px' }}>
                        {item.shortcut}
                      </span>
                    )}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 1: 创建 MenuBar.tsx**

```bash
cat > src/components/MenuBar.tsx << 'EOF'
// Paste the full MenuBar code above
EOF
```

- [ ] **Step 2: 验证组件可编译**

运行 `npx tsc --noEmit` 确认无错误

- [ ] **Step 3: 提交**

```bash
git add src/components/MenuBar.tsx && git commit -m "feat: add MenuBar component"
```

---

### Task 3: 创建 DockBar 格式工具栏组件

**Files:**
- Create: `src/components/DockBar.tsx`

```typescript
import { useEditor } from '../contexts/EditorContext';

export function DockBar() {
  const { } = useEditor();

  const ToolButton = ({ title, children, onClick }: { title: string; children: React.ReactNode; onClick: () => void }) => (
    <button
      title={title}
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded hover:bg-hover-bg transition-colors"
      style={{ color: 'var(--text-primary)' }}
    >
      {children}
    </button>
  );

  return (
    <div
      className="h-9 flex items-center gap-1 px-2 border-b select-none"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
    >
      {/* Bold */}
      <ToolButton title="Bold (Ctrl+B)">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
        </svg>
      </ToolButton>

      {/* Italic */}
      <ToolButton title="Italic (Ctrl+I)">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
        </svg>
      </ToolButton>

      {/* Underline */}
      <ToolButton title="Underline (Ctrl+U)">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2h-14z"/>
        </svg>
      </ToolButton>

      {/* Strikethrough */}
      <ToolButton title="Strikethrough">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/>
        </svg>
      </ToolButton>

      <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--border)' }} />

      {/* H1 */}
      <ToolButton title="Heading 1 (Ctrl+1)">
        <span className="font-bold text-xs">H1</span>
      </ToolButton>

      {/* H2 */}
      <ToolButton title="Heading 2 (Ctrl+2)">
        <span className="font-bold text-xs">H2</span>
      </ToolButton>

      {/* H3 */}
      <ToolButton title="Heading 3 (Ctrl+3)">
        <span className="font-bold text-xs">H3</span>
      </ToolButton>

      <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--border)' }} />

      {/* Quote */}
      <ToolButton title="Quote (Ctrl+Shift+Q)">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 17h3l2-4V7H5v6h3l-2 4zm8 0h3l2-4V7h-6v6h3l-2 4z"/>
        </svg>
      </ToolButton>

      {/* Horizontal Line */}
      <ToolButton title="Horizontal Line">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 11h16v2H4z"/>
        </svg>
      </ToolButton>

      {/* Bullet List */}
      <ToolButton title="Bullet List (Ctrl+Shift+U)">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
        </svg>
      </ToolButton>

      {/* Numbered List */}
      <ToolButton title="Numbered List (Ctrl+Shift+O)">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.5L1.5 6H2v1h1V6l1.5 1.5L2 9H1V6h1zm3 0h5v-.5H6V7h5v1l-2 2.5L6 12v2h5v-1H6.5V11H9v-1zm0 0v-.5V7h5v1l-2 2.5L6 12v2h5v-1H6.5V11H9v-1z"/>
        </svg>
      </ToolButton>

      <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--border)' }} />

      {/* Code Block */}
      <ToolButton title="Code Block (Ctrl+Shift+K)">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm4.6-4.6L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
        </svg>
      </ToolButton>

      {/* Link */}
      <ToolButton title="Link (Ctrl+K)">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
        </svg>
      </ToolButton>

      {/* Image */}
      <ToolButton title="Image">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
      </ToolButton>
    </div>
  );
}
```

- [ ] **Step 1: 创建 DockBar.tsx**

```bash
cat > src/components/DockBar.tsx << 'EOF'
// Paste the full DockBar code above
EOF
```

- [ ] **Step 2: 验证组件可编译**

运行 `npx tsc --noEmit` 确认无错误

- [ ] **Step 3: 提交**

```bash
git add src/components/DockBar.tsx && git commit -m "feat: add DockBar format toolbar"
```

---

### Task 4: 更新 theme.css 添加 Typora 风格样式

**Files:**
- Modify: `src/styles/theme.css`

- [ ] **Step 1: 添加 Typora 光标和选中文本样式**

在现有 `:root` 和 `.dark` 后添加:

```css
/* Typora-style cursor and selection */
:root {
  /* ... existing variables ... */
  --cursor-color: #7C3AED;
  --selection-bg: rgba(124, 58, 237, 0.3);
}

.dark {
  /* ... existing variables ... */
  --cursor-color: #a78bfa;
  --selection-bg: rgba(167, 139, 250, 0.3);
}

/* contenteditable styling */
[contenteditable] {
  caret-color: var(--cursor-color);
}

[contenteditable] ::selection {
  background-color: var(--selection-bg);
}

/* Typora-style scrollbar */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb);
}

/* Code block styling */
pre {
  background-color: var(--bg-secondary);
  border-radius: 4px;
  padding: 12px;
  overflow-x: auto;
}

code {
  font-family: 'Fira Code', 'Consolas', monospace;
}
```

- [ ] **Step 2: 提交**

```bash
git add src/styles/theme.css && git commit -m "feat: add Typora-style cursor and scrollbar styles"
```

---

### Task 5: 重写 App.tsx 布局

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 重写 App.tsx 使用新的 MenuBar + DockBar 布局**

```typescript
import { useState } from 'react';
import { EditorProvider } from './contexts/EditorContext';
import { MenuBar } from './components/MenuBar';
import { DockBar } from './components/DockBar';
import { Sidebar } from './components/Sidebar';
import { WysiwygEditor } from './components/WysiwygEditor';
import { TabBar } from './components/TabBar';
import { StatusBar } from './components/StatusBar';
import { useEditor } from './contexts/EditorContext';
import './styles/theme.css';

function AppContent() {
  const { editor, setContent } = useEditor();
  const [sidebarVisible, setSidebarVisible] = useState(true);

  return (
    <div
      className="flex flex-col h-screen"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <MenuBar />
      <DockBar />
      <div className="flex flex-1 overflow-hidden">
        {sidebarVisible && <Sidebar />}
        <div className="flex-1 flex flex-col overflow-hidden">
          <TabBar />
          <div className="flex-1 overflow-hidden">
            <WysiwygEditor
              content={editor.content}
              onChange={setContent}
              fileType={editor.fileType}
            />
          </div>
        </div>
      </div>
      <StatusBar />
    </div>
  );
}

function App() {
  return (
    <EditorProvider>
      <AppContent />
    </EditorProvider>
  );
}

export default App;
```

- [ ] **Step 2: 验证编译**

运行 `npx tsc --noEmit` 确认无错误

- [ ] **Step 3: 提交**

```bash
git add src/App.tsx && git commit -m "feat: rewrite App layout with MenuBar and DockBar"
```

---

## Phase 2: WYSIWYG 引擎核心

### Task 6: 重写 WysiwygEditor 实现真正的原地渲染

**Files:**
- Modify: `src/components/WysiwygEditor.tsx`

核心思路:
- 将Markdown内容解析为tokens
- 每个block level元素放在单独的contenteditable容器中
- 行内元素实时渲染

- [ ] **Step 1: 重写 WysiwygEditor.tsx**

```typescript
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { renderMarkdown } from '../utils/markdown';
import { useEditor } from '../contexts/EditorContext';

interface WysiwygEditorProps {
  content: string;
  onChange: (value: string) => void;
  fileType?: 'markdown' | 'html' | 'text';
}

export const WysiwygEditor = React.memo(function WysiwygEditor({
  content,
  onChange,
  fileType = 'markdown'
}: WysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const lastContent = useRef(content);

  // Render markdown content to the editor
  useEffect(() => {
    if (!editorRef.current) return;
    if (content === lastContent.current) return;
    
    isInternalChange.current = true;
    const html = renderMarkdown(content);
    editorRef.current.innerHTML = html;
    lastContent.current = content;
    
    // Restore cursor to end
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editorRef.current);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
    
    isInternalChange.current = false;
  }, [content]);

  const handleInput = useCallback(() => {
    if (!editorRef.current || isInternalChange.current) return;
    
    isInternalChange.current = true;
    // Convert HTML back to markdown on input
    const html = editorRef.current.innerHTML;
    // TODO: Implement HTML to markdown conversion
    // For now, use innerText as fallback
    lastContent.current = editorRef.current.innerText;
    onChange(lastContent.current);
    isInternalChange.current = false;
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle markdown shortcuts
    if (!e.ctrlKey && !e.metaKey) return;

    const shortcuts: Record<string, () => void> = {
      'b': () => document.execCommand('bold'),
      'i': () => document.execCommand('italic'),
      'u': () => document.execCommand('underline'),
    };

    const handler = shortcuts[e.key];
    if (handler) {
      e.preventDefault();
      handler();
    }
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="h-full w-full overflow-auto p-8 outline-none"
        style={{
          fontSize: '16px',
          lineHeight: '1.8',
          maxWidth: '900px',
          margin: '0 auto',
          backgroundColor: 'var(--bg-primary)',
        }}
        onInput={handleInput}
        onBlur={handleInput}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
});
```

- [ ] **Step 2: 验证组件**

运行开发服务器确认编辑器可加载

- [ ] **Step 3: 提交**

```bash
git add src/components/WysiwygEditor.tsx && git commit -m "refactor: rewrite WysiwygEditor for true WYSIWYG"
```

---

### Task 7: 实现 HTML 到 Markdown 转换工具

**Files:**
- Create: `src/utils/htmlToMarkdown.ts`

- [ ] **Step 1: 创建 htmlToMarkdown.ts**

```typescript
/**
 * Convert HTML content back to Markdown
 * This is a simplified version - full conversion is complex
 */

export function htmlToMarkdown(html: string): string {
  // Create a temporary div to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  return processNode(temp);
}

function processNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || '';
  }
  
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }
  
  const el = node as HTMLElement;
  const tagName = el.tagName.toLowerCase();
  
  switch (tagName) {
    case 'h1': return `# ${processChildNodes(el)}\n\n`;
    case 'h2': return `## ${processChildNodes(el)}\n\n`;
    case 'h3': return `### ${processChildNodes(el)}\n\n`;
    case 'h4': return `#### ${processChildNodes(el)}\n\n`;
    case 'h5': return `##### ${processChildNodes(el)}\n\n`;
    case 'h6': return `###### ${processChildNodes(el)}\n\n`;
    case 'p': return `${processChildNodes(el)}\n\n`;
    case 'strong':
    case 'b': return `**${processChildNodes(el)}**`;
    case 'em':
    case 'i': return `*${processChildNodes(el)}*`;
    case 'u': return `<u>${processChildNodes(el)}</u>`;
    case 's':
    case 'del': return `~~${processChildNodes(el)}~~`;
    case 'code': return `\`${processChildNodes(el)}\``;
    case 'pre': return `\`\`\`\n${el.textContent?.trim() || ''}\n\`\`\`\n\n`;
    case 'a': return `[${processChildNodes(el)}](${el.getAttribute('href') || ''})`;
    case 'img': return `![${el.getAttribute('alt') || ''}](${el.getAttribute('src') || ''})`;
    case 'blockquote': return `> ${processChildNodes(el).trim().replace(/\n/g, '\n> ')}\n\n`;
    case 'ul': return processListItems(el, '-') + '\n';
    case 'ol': return processListItems(el, '1.') + '\n';
    case 'li': return processChildNodes(el);
    case 'br': return '\n';
    case 'hr': return '---\n\n';
    default: return processChildNodes(el);
  }
}

function processChildNodes(el: HTMLElement): string {
  return Array.from(el.childNodes)
    .map(node => processNode(node))
    .join('');
}

function processListItems(el: HTMLElement, prefix: string): string {
  const items = Array.from(el.querySelectorAll(':scope > li'))
    .map(li => `${prefix} ${processChildNodes(li as HTMLElement)}`)
    .join('\n');
  return items;
}
```

- [ ] **Step 2: 验证编译**

运行 `npx tsc --noEmit`

- [ ] **Step 3: 提交**

```bash
git add src/utils/htmlToMarkdown.ts && git commit -m "feat: add HTML to Markdown converter"
```

---

### Task 8: 扩展 EditorContext 支持 source mode

**Files:**
- Modify: `src/contexts/EditorContext.tsx`

- [ ] **Step 1: 添加 viewMode 切换功能**

在 EditorContext 中已有 `viewMode: 'wysiwyg' | 'source'`，无需修改。
只需要确保 UI 组件响应这个状态。

- [ ] **Step 2: 提交**

```bash
git commit -m "feat: EditorContext already supports viewMode, ready for source mode toggle"
```

---

## Phase 3: 功能完善

### Task 9: 实现完整快捷键系统

**Files:**
- Modify: `src/components/DockBar.tsx` (连接快捷键到动作)
- Modify: `src/utils/shortcuts.ts` (添加更多快捷键处理函数)
- Create: `src/hooks/useShortcuts.ts` (统一快捷键Hook)

- [ ] **Step 1: 创建 useShortcuts hook**

```typescript
import { useEffect, useCallback } from 'react';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: (e: KeyboardEvent) => void;
}

export function useShortcuts(shortcuts: Shortcut[]) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : (!e.ctrlKey && !e.metaKey);
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = shortcut.alt ? e.altKey : !e.altKey;
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
      
      if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
        e.preventDefault();
        shortcut.handler(e);
        return;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
```

- [ ] **Step 2: 提交**

```bash
git add src/hooks/useShortcuts.ts && git commit -m "feat: add useShortcuts hook"
```

---

### Task 10: 完善 Sidebar 文件树功能

**Files:**
- Review: `src/components/Sidebar.tsx`

- [ ] **Step 1: 检查现有 Sidebar 实现**

确认当前实现状态

- [ ] **Step 2: 如果需要，添加右键菜单和拖拽支持**

这取决于现有实现的完整度

- [ ] **Step 3: 提交**

```bash
git commit -m "feat: review and enhance Sidebar functionality"
```

---

### Task 11: 实现自动保存

**Files:**
- Review: `src/hooks/useAutoSave.ts`

- [ ] **Step 1: 检查现有 useAutoSave 实现**

确认当前实现状态

- [ ] **Step 2: 如需要，调整防抖时间和其他参数**

- [ ] **Step 3: 提交**

```bash
git commit -m "feat: review auto-save implementation"
```

---

### Task 12: TabBar 多标签支持

**Files:**
- Review: `src/components/TabBar.tsx`

- [ ] **Step 1: 检查现有 TabBar 实现**

确认当前实现状态

- [ ] **Step 2: 如需要，添加关闭按钮和右键菜单**

- [ ] **Step 3: 提交**

```bash
git commit -m "feat: review and enhance TabBar functionality"
```

---

## Phase 4: 优化打磨

### Task 13: 主题系统完善

**Files:**
- Modify: `src/styles/theme.css`
- Modify: `src/hooks/useTheme.ts` (如需要)

- [ ] **Step 1: 添加 Solarized 主题支持**

- [ ] **Step 2: 验证所有主题正确切换**

- [ ] **Step 3: 提交**

```bash
git commit -m "feat: complete theme system with Solarized"
```

---

### Task 14: 性能优化

- [ ] **Step 1: 检查大文件编辑性能**

- [ ] **Step 2: 优化渲染逻辑**

- [ ] **Step 3: 提交**

```bash
git commit -m "perf: optimize rendering performance"
```

---

### Task 15: 最终 Bug 修复

- [ ] **Step 1: 全面测试所有功能**

- [ ] **Step 2: 修复发现的问题**

- [ ] **Step 3: 提交**

```bash
git commit -m "fix: resolve final issues"
```

---

## 实施检查清单

完成所有任务后验证:

- [ ] WYSIWYG编辑正常工作，输入即渲染
- [ ] MenuBar 所有菜单项可点击
- [ ] DockBar 所有格式按钮生效
- [ ] 快捷键 Ctrl+B/I/U/K 等工作正常
- [ ] Sidebar 文件树显示正确
- [ ] 主题切换 Light/Dark/Solarized 正常
- [ ] 自动保存正常工作
- [ ] TabBar 多标签切换正常
- [ ] 无控制台错误

---

## 成功标准

- ✅ 真正的WYSIWYG编辑体验
- ✅ MenuBar + DockBar Typora风格UI
- ✅ 所有主要快捷键可用
- ✅ 文件树支持基本操作
- ✅ 主题切换正常
- ✅ 自动保存工作正常
- ✅ 无明显性能问题