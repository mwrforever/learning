import React, { useRef, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { applyBold, applyItalic, insertLink } from '../utils/shortcuts';

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
        if (!model || !selection) return;
        const start = model.getOffsetAt(selection.getStartPosition());
        const end = model.getOffsetAt(selection.getEndPosition());
        const text = model.getValue();
        const result = applyBold(text, start, end);
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
        if (!model || !selection) return;
        const start = model.getOffsetAt(selection.getStartPosition());
        const end = model.getOffsetAt(selection.getEndPosition());
        const text = model.getValue();
        const result = applyItalic(text, start, end);
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
        if (!model || !selection) return;
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