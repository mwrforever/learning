export type ViewMode = 'wysiwyg' | 'source';

export interface EditorState {
  content: string;
  filePath: string | null;
  fileType: 'markdown' | 'html' | 'text';
  viewMode: ViewMode;
  isDirty: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved';
}
