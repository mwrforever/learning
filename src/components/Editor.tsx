import { useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
  language?: string;
}

export function Editor({ content, onChange, language = 'markdown' }: EditorProps) {
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
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
