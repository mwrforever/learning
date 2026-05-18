export type ViewMode = 'wysiwyg' | 'source';
export type FileType = 'markdown' | 'html' | 'text';
export type SaveStatus = 'saved' | 'saving' | 'unsaved';

export interface EditorState {
  content: string;
  filePath: string | null;
  fileType: FileType;
  viewMode: ViewMode;
  isDirty: boolean;
  saveStatus: SaveStatus;
}

export interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeNode[];
}
