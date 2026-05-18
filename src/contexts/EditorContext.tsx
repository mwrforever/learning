import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ViewMode, FileType, SaveStatus, FileTreeNode } from '../types';

interface EditorState {
  content: string;
  filePath: string | null;
  fileType: FileType;
  viewMode: ViewMode;
  isDirty: boolean;
  saveStatus: SaveStatus;
}

interface SidebarState {
  currentPath: string | null;
  fileTree: FileTreeNode[];
  expandedFolders: Set<string>;
  selectedFile: string | null;
}

interface EditorContextValue {
  editor: EditorState;
  sidebar: SidebarState;
  setContent: (content: string) => void;
  setFilePath: (path: string | null) => void;
  setFileType: (type: FileType) => void;
  setViewMode: (mode: ViewMode) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setIsDirty: (dirty: boolean) => void;
  setCurrentPath: (path: string | null) => void;
  setFileTree: (tree: FileTreeNode[]) => void;
  toggleFolder: (path: string) => void;
  setSelectedFile: (path: string | null) => void;
  resetEditor: () => void;
}

const initialEditorState: EditorState = {
  content: '',
  filePath: null,
  fileType: 'markdown',
  viewMode: 'wysiwyg',
  isDirty: false,
  saveStatus: 'saved',
};

const initialSidebarState: SidebarState = {
  currentPath: null,
  fileTree: [],
  expandedFolders: new Set(),
  selectedFile: null,
};

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [editor, setEditor] = useState<EditorState>(initialEditorState);
  const [sidebar, setSidebar] = useState<SidebarState>(initialSidebarState);

  const setContent = useCallback((content: string) => {
    setEditor((prev) => ({ ...prev, content, isDirty: true }));
  }, []);

  const setFilePath = useCallback((filePath: string | null) => {
    setEditor((prev) => ({ ...prev, filePath }));
  }, []);

  const setFileType = useCallback((fileType: FileType) => {
    setEditor((prev) => ({ ...prev, fileType }));
  }, []);

  const setViewMode = useCallback((viewMode: ViewMode) => {
    setEditor((prev) => ({ ...prev, viewMode }));
  }, []);

  const setSaveStatus = useCallback((saveStatus: SaveStatus) => {
    setEditor((prev) => ({ ...prev, saveStatus }));
  }, []);

  const setIsDirty = useCallback((isDirty: boolean) => {
    setEditor((prev) => ({ ...prev, isDirty }));
  }, []);

  const setCurrentPath = useCallback((currentPath: string | null) => {
    setSidebar((prev) => ({ ...prev, currentPath }));
  }, []);

  const setFileTree = useCallback((fileTree: FileTreeNode[]) => {
    setSidebar((prev) => ({ ...prev, fileTree }));
  }, []);

  const toggleFolder = useCallback((path: string) => {
    setSidebar((prev) => {
      const newExpanded = new Set(prev.expandedFolders);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return { ...prev, expandedFolders: newExpanded };
    });
  }, []);

  const setSelectedFile = useCallback((selectedFile: string | null) => {
    setSidebar((prev) => ({ ...prev, selectedFile }));
  }, []);

  const resetEditor = useCallback(() => {
    setEditor(initialEditorState);
  }, []);

  return (
    <EditorContext.Provider
      value={{
        editor,
        sidebar,
        setContent,
        setFilePath,
        setFileType,
        setViewMode,
        setSaveStatus,
        setIsDirty,
        setCurrentPath,
        setFileTree,
        toggleFolder,
        setSelectedFile,
        resetEditor,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
}