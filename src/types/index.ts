export type ViewMode = 'wysiwyg' | 'source';
export type Theme = 'light' | 'dark';

export interface EditorState {
  content: string;
  filePath: string | null;
  fileType: 'markdown' | 'html' | 'text';
  viewMode: ViewMode;
  theme: Theme;
  isDirty: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved';
}
