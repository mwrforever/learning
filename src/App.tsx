import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { Editor } from './components/Editor';
import { Renderer } from './components/Renderer';
import { StatusBar } from './components/StatusBar';
import { useAutoSave } from './hooks/useAutoSave';
import { useShortcuts } from './hooks/useShortcuts';
import { EditorState, ViewMode, Theme } from './types';

export function App() {
  const [state, setState] = useState<EditorState>({
    content: '',
    filePath: null,
    fileType: 'markdown',
    viewMode: 'wysiwyg',
    theme: 'dark',
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
    {
      key: 'toggle-theme',
      handler: () => {
        setState(prev => ({
          ...prev,
          theme: prev.theme === 'dark' ? 'light' : 'dark',
        }));
      },
    },
  ]);

  useEffect(() => {
    document.documentElement.className = state.theme;
  }, [state.theme]);

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
        theme: state.theme,
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

  const handleThemeToggle = () => {
    setState(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  return (
    <div className={`h-screen flex flex-col ${state.theme === 'dark' ? 'bg-[#1e1e1e] text-gray-100' : 'bg-white text-gray-900'}`}>
      <div className={`flex items-center justify-between px-6 py-3 ${state.theme === 'dark' ? 'bg-[#252526] border-b border-[#3e3e42]' : 'bg-gray-50 border-b border-gray-200'}`}>
        <div className="flex items-center gap-4">
          <h1 className={`text-lg font-medium ${state.theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
            {state.filePath ? state.filePath.split(/[/\\]/).pop() : 'Untitled'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenFile}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${state.theme === 'dark' 
              ? 'bg-[#3c3c3c] hover:bg-[#4a4a4a] text-gray-100' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          >
            打开文件
          </button>
          <button
            onClick={handleThemeToggle}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${state.theme === 'dark' 
              ? 'bg-[#3c3c3c] hover:bg-[#4a4a4a] text-gray-100' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          >
            {state.theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {state.viewMode === 'wysiwyg' ? (
          <>
            <div className={`w-1/2 ${state.theme === 'dark' ? 'border-r border-[#3e3e42]' : 'border-r border-gray-200'}`}>
              <Editor content={state.content} onChange={handleContentChange} theme={state.theme} language={state.fileType === 'markdown' ? 'markdown' : state.fileType === 'html' ? 'html' : 'plaintext'} />
            </div>
            <div className="w-1/2">
              <Renderer content={state.content} fileType={state.fileType} theme={state.theme} />
            </div>
          </>
        ) : (
          <div className="w-full">
            <Editor content={state.content} onChange={handleContentChange} theme={state.theme} language={state.fileType === 'markdown' ? 'markdown' : state.fileType === 'html' ? 'html' : 'plaintext'} />
          </div>
        )}
      </div>

      <StatusBar
        saveStatus={state.saveStatus}
        filePath={state.filePath}
        wordCount={wordCount}
        theme={state.theme}
      />
    </div>
  );
}
