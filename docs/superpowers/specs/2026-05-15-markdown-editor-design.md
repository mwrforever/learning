# Typora 风格 Markdown 编辑器设计文档

**日期**: 2026-05-15
**项目**: Typora Clone - Markdown/HTML 编辑器
**技术栈**: Tauri + Rust + React + Monaco Editor + marked.js + TailwindCSS

## 概述

构建一个跨平台桌面应用，复刻 Typora 的 Markdown 编辑功能，支持深色/浅色主题切换、Markdown 和 HTML 实时渲染、源码查看编辑、侧边栏文件树、常用快捷键，以及所见即所得的编辑体验。

## 需求

### 功能需求

- **主题切换**：支持手动切换（浅色/深色）和跟随系统自动切换
- **Markdown 编辑**：类似 Typora 的单栏所见即所得编辑体验
- **HTML 支持**：支持 .html 文件的实时渲染和编辑
- **源码模式**：可切换视图查看和编辑原始 Markdown/HTML 源码
- **侧边栏**：显示文件树，支持展开/折叠文件夹，点击文件打开
- **快捷键**：支持常用 Markdown 快捷键和编辑操作快捷键
- **文件格式**：支持 .md、.html 及其他文本文件

### 非功能需求

- **性能**：流畅的编辑体验，支持大文件
- **主题支持**：深色/浅色主题切换，跟随系统
- **可维护性**：清晰的架构，模块化设计

## 架构设计

### 三层架构

```
┌─────────────────────────────────────────────────────────────┐
│                      顶部工具栏                              │
│  [新建] [打开] [保存] │ [预览] [源码] │ [☀/🌙主题]            │
├──────────────┬──────────────────────────────────────────────┤
│             │                                              │
│   侧边栏     │              编辑区                          │
│  (文件树)    │        (WYSIWYG / 源码模式)                   │
│             │                                              │
├──────────────┴──────────────────────────────────────────────┤
│                      底部状态栏                              │
│  文件路径                    │ 字数 │ 文件类型 │ 保存状态      │
└─────────────────────────────────────────────────────────────┘
```

**Rust 后端层**:
- 文件系统操作（读取目录、读写文件）
- 自动保存逻辑
- 窗口管理
- 系统快捷键绑定

**Web 前端层**:
- React + TypeScript
- Monaco Editor（编辑器核心 - 源码模式）
- marked.js（Markdown 解析）
- DOM 渲染（WYSIWYG 模式）
- 文件树组件

**通信层**:
- Tauri IPC 机制
- 前后端通信

### 技术栈

**Rust 后端**:
- Tauri 框架
- tokio（异步运行时）
- serde（序列化）

**前端**:
- React + TypeScript
- Monaco Editor
- marked.js
- TailwindCSS
- DOMPurify（HTML 净化）

### 视图模式

| 模式 | 说明 | 核心组件 |
|------|------|---------|
| WYSIWYG | 所见即所得，渲染后的内容可直接编辑 | contenteditable div + marked.js |
| 源码 | 原始代码视图 | Monaco Editor |

**切换方式**：
- 工具栏按钮
- 快捷键 Ctrl+`

## 主题系统

### 主题模式

| 模式 | 触发方式 | 实现方式 |
|------|---------|---------|
| 浅色主题 | 手动点击 ☀ 按钮 | CSS 变量切换 |
| 深色主题 | 手动点击 🌙 按钮 | CSS 变量切换 |
| 跟随系统 | 系统主题变化时 | `prefers-color-scheme` 媒体查询 |

### CSS 变量设计

```css
/* 浅色主题 */
--bg-primary: #ffffff;
--bg-secondary: #f7f7f7;
--bg-sidebar: #f5f5f5;
--text-primary: #333333;
--text-secondary: #666666;
--text-muted: #999999;
--border: #e0e0e0;
--accent: #7C3AED;
--hover-bg: #eeeeee;

/* 深色主题 */
--bg-primary: #1a1a1a;
--bg-secondary: #252525;
--bg-sidebar: #222222;
--text-primary: #e0e0e0;
--text-secondary: #a0a0a0;
--text-muted: #707070;
--border: #3a3a3a;
--accent: #7C3AED;
--hover-bg: #333333;
```

## 组件设计

### 1. Sidebar（侧边栏）

**功能**：
- 显示文件树，支持展开/折叠文件夹
- 点击文件夹切换展开/折叠状态
- 点击文件打开文件
- 按字母排序显示文件
- 当前选中文件高亮

**文件类型处理**：
- `.md` 文件 → Markdown 渲染模式
- `.html`/`.htm` 文件 → HTML 渲染模式
- 其他文件 → 纯文本显示

**状态**：
```typescript
interface SidebarState {
  currentPath: string | null;  // 当前打开的文件夹路径
  expandedFolders: Set<string>;  // 已展开的文件夹
  selectedFile: string | null;  // 当前选中的文件
}
```

### 2. Toolbar（工具栏）

**功能**：
- 文件操作：新建、打开文件夹、保存
- 视图切换：预览（WYSIWYG）、源码
- 主题切换：浅色、深色、跟随系统

**布局**：
```
[新建] [打开文件夹] [保存] │ [预览] [源码] │ [☀/🌙/系统]
```

### 3. Editor（编辑区）

**WYSIWYG 模式**：
- 使用 contenteditable div
- marked.js 渲染 Markdown
- 直接在渲染结果上编辑
- 支持输入时实时渲染

**源码模式**：
- Monaco Editor
- 根据文件类型设置语言模式
- Markdown / HTML / Plaintext

### 4. StatusBar（状态栏）

**功能**：
- 显示当前文件路径
- 字数统计
- 文件类型
- 保存状态（已保存 / 保存中 / 未保存）

## 快捷键系统

### Markdown 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+B` | 加粗 |
| `Ctrl+I` | 斜体 |
| `Ctrl+K` | 链接 |
| `Ctrl+Shift+C` | 代码块 |
| `Ctrl+Shift+H` | 标题 |

### 编辑操作快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+S` | 保存 |
| `Ctrl+Shift+S` | 另存为 |
| `Ctrl+N` | 新建文件 |
| `Ctrl+O` | 打开文件夹 |
| `Ctrl+`` | 切换视图 |
| `Ctrl+Z` | 撤销 |
| `Ctrl+Y` | 重做 |

### 实现方式

- React 组件内监听 keydown 事件
- 根据当前焦点组件决定是否处理快捷键
- 编辑器内部快捷键由 Monaco Editor 处理

## 数据流

### 文件操作流程

**打开文件夹**：
```
用户选择文件夹 → Tauri 读取目录 → 返回文件树结构 → 前端渲染侧边栏
```

**打开文件**：
```
用户点击文件 → Tauri 读取文件内容 → 前端判断文件类型 → 渲染编辑区
```

**保存文件**：
```
用户编辑 → 防抖 500ms → Tauri IPC → Rust 写入文件 → 更新状态栏
```

### 文件识别逻辑

```typescript
function detectFileType(filePath: string, content: string): FileType {
  const ext = filePath.split('.').pop()?.toLowerCase();
  if (ext === 'md') return 'markdown';
  if (ext === 'html' || ext === 'htm') return 'html';
  return 'text';
}
```

## 项目结构

```
markdown-editor/
├── src-tauri/                    # Rust 后端
│   ├── src/
│   │   ├── main.rs            # 应用入口
│   │   ├── commands.rs        # Tauri 命令
│   │   └── file.rs            # 文件操作
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                        # 前端
│   ├── components/
│   │   ├── Sidebar.tsx       # 侧边栏组件
│   │   ├── Toolbar.tsx       # 工具栏组件
│   │   ├── Editor.tsx        # 编辑器容器
│   │   ├── WysiwygEditor.tsx # WYSIWYG 编辑器
│   │   ├── SourceEditor.tsx  # 源码编辑器
│   │   └── StatusBar.tsx     # 状态栏
│   ├── hooks/
│   │   ├── useTheme.ts       # 主题管理
│   │   ├── useFileTree.ts    # 文件树操作
│   │   └── useAutoSave.ts    # 自动保存
│   ├── contexts/
│   │   └── EditorContext.tsx # 编辑器状态管理
│   ├── styles/
│   │   └── theme.css         # 主题样式
│   └── App.tsx
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

## 实施计划

### 阶段 1：基础架构重构
- 重构项目结构
- 配置 TailwindCSS 主题系统
- 实现主题切换功能（浅色/深色/跟随系统）

### 阶段 2：侧边栏实现
- 实现文件树组件
- 实现文件夹展开/折叠
- 实现文件打开功能

### 阶段 3：编辑器核心
- 实现 WYSIWYG 编辑器组件
- 实现 Monaco 源码编辑器
- 实现视图切换

### 阶段 4：渲染引擎
- 集成 marked.js
- 实现 Markdown 渲染
- 实现 HTML 渲染

### 阶段 5：功能完善
- 实现自动保存
- 实现快捷键
- 完善状态栏

## 验收标准

- [ ] 支持深色/浅色主题切换
- [ ] 支持跟随系统主题
- [ ] 侧边栏显示文件树，按字母排序
- [ ] 点击文件夹展开/折叠
- [ ] 点击 .md/.html 文件在编辑器中打开
- [ ] WYSIWYG 模式下实时渲染 Markdown/HTML
- [ ] 源码模式下使用 Monaco Editor
- [ ] Ctrl+` 切换视图
- [ ] 文件操作快捷键可用
- [ ] 底部状态栏显示文件信息