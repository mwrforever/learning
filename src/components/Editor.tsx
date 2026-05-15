import { useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { Theme } from '../types';

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
  language?: string;
  theme: Theme;
}

export function Editor({ content, onChange, language = 'markdown', theme }: EditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  return (
    <div className="h-full w-full">
      <MonacoEditor
        language={language}
        value={content}
        onChange={(value: string | undefined) => onChange(value || '')}
        onMount={handleEditorDidMount}
        theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
        options={{
          minimap: { enabled: false },
          fontSize: 15,
          lineNumbers: 'off',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          padding: { top: 20, bottom: 20 },
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      />
    </div>
  );
}
