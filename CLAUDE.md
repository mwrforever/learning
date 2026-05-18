# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Typora Clone Markdown Editor** - A cross-platform desktop markdown editor built with Tauri + React.

## Commands

```bash
# Frontend development
npm run dev          # Start Vite dev server
npm run build        # Production build (TypeScript + Vite)
npm run preview      # Preview production build

# Tauri (desktop)
npm run tauri:dev   # Start Tauri dev mode
npm run tauri:build # Build Tauri app

# TypeScript
npx tsc --noEmit    # Type check (no emit)
```

## Architecture

```
┌─────────────────────────────────────┐
│         React Frontend              │  src/ - UI components, hooks, contexts
│   (State: EditorContext + useState) │  - WysiwygEditor.tsx: contenteditable div
├─────────────────────────────────────┤  - SourceEditor.tsx: Monaco Editor
│         Tauri IPC Bridge            │  - Sidebar.tsx: file tree
│   (invoke, commands)               │
├─────────────────────────────────────┤
│         Rust Backend                │  src-tauri/src/ - Rust source
│   (file I/O, commands)             │  - commands.rs: read_file, write_file
└─────────────────────────────────────┘
```

### Frontend Structure (src/)

- **components/** - UI components (Toolbar, Sidebar, Editor, StatusBar)
- **hooks/** - React hooks (useAutoSave, useFileOperations)
- **contexts/** - EditorContext for global state
- **utils/** - markdown.ts (marked.js), shortcuts.ts
- **styles/** - theme.css (CSS variables for light/dark)

### Backend Structure (src-tauri/src/)

- **main.rs** - Tauri app entry, command registration
- **commands.rs** - `read_file`, `write_file` commands

### Communication Flow

```
Frontend → Tauri invoke() → Rust command → file system
                ↓
         Result<FileInfo, String>
                ↓
         Frontend updates state
```

## State Management

EditorContext provides global state: `content`, `filePath`, `fileType`, `viewMode`, `isDirty`, `saveStatus`

Theme system: CSS variables (`--bg-primary`, `--text-primary`, etc.) toggled via `.dark` class on `<html>`

## Key Conventions

- Worktrees required for feature work: `git worktree add .worktrees/<name> -b feature/<name>`
- All UI colors via CSS variables (no hardcoded hex)
- File type detected by extension: `.md` → markdown, `.html` → html, other → text
- Auto-save with 500ms debounce when filePath exists