import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { Editor } from './components/Editor';
import { Renderer } from './components/Renderer';
import { ViewSwitcher } from './components/ViewSwitcher';
import { StatusBar } from './components/StatusBar';
import { useAutoSave } from './hooks/useAutoSave';
import { useShortcuts } from './hooks/useShortcuts';
import { EditorState, ViewMode } from './types';

export function App() {
  const [state, setState] = useState<EditorState>({
    content: '',
    filePath: null,
    fileType: 'markdown',
    viewMode: 'wysiwyg',
    isDirty: false,
    saveStatus: 'saved',
  });

  const wordCount = state.content.split(/\s+/).filter(w => w.length > 0).length;

  useAutoSave({
    content: state.content,
    filePath: state.filePath,
    onSaveComplete: () => {
      setState(prev => ({ ...prev, saveStatus: 'saved', isDirty: false }));
    },
    onSaveError: (error) => {
      console.error('Save error:', error);
    },
  });

  useShortcuts([
    {
      key: 'toggle-view',
      handler: () => {
        setState(prev => ({
          ...prev,
          viewMode: prev.viewMode === 'wysiwyg' ? 'source' : 'wysiwyg',
        }));
      },
    },
  ]);

  const handleOpenFile = async () => {
    const selected = await open({
      multiple: false,
      filters: [
        { name: 'Markdown', extensions: ['md', 'markdown'] },
        { name: 'HTML', extensions: ['html', 'htm'] },
        { name: 'Text', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (selected && typeof selected === 'string') {
      const content = await invoke<string>('read_file', { path: selected });
      const fileType = selected.endsWith('.md') || selected.endsWith('.markdown')
        ? 'markdown'
        : selected.endsWith('.html') || selected.endsWith('.htm')
        ? 'html'
        : 'text';

      setState({
        content,
        filePath: selected,
        fileType,
        viewMode: 'wysiwyg',
        isDirty: false,
        saveStatus: 'saved',
      });
    }
  };

  const handleContentChange = (value: string) => {
    setState(prev => ({
      ...prev,
      content: value,
      isDirty: true,
      saveStatus: 'unsaved',
    }));
  };

  const handleModeChange = (mode: ViewMode) => {
    setState(prev => ({ ...prev, viewMode: mode }));
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <h1 className="text-xl font-bold">Markdown Editor</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handleOpenFile}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded"
          >
            打开文件
          </button>
          <ViewSwitcher currentMode={state.viewMode} onModeChange={handleModeChange} />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {state.viewMode === 'wysiwyg' ? (
          <>
            <div className="w-1/2 border-r border-gray-700">
              <Editor content={state.content} onChange={handleContentChange} language={state.fileType === 'markdown' ? 'markdown' : state.fileType === 'html' ? 'html' : 'plaintext'} />
            </div>
            <div className="w-1/2">
              <Renderer content={state.content} fileType={state.fileType} />
            </div>
          </>
        ) : (
          <div className="w-full">
            <Editor content={state.content} onChange={handleContentChange} language={state.fileType === 'markdown' ? 'markdown' : state.fileType === 'html' ? 'html' : 'plaintext'} />
          </div>
        )}
      </div>

      <StatusBar
        saveStatus={state.saveStatus}
        filePath={state.filePath}
        wordCount={wordCount}
      />
    </div>
  );
}
