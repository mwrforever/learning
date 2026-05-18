import { useCallback, useRef, useState } from 'react';
import { MenuBar } from './components/MenuBar';
import { DockBar } from './components/DockBar';
import { Sidebar } from './components/Sidebar';
import { SourceEditor } from './components/SourceEditor';
import { WysiwygEditor, formatSelection } from './components/WysiwygEditor';
import { StatusBar } from './components/StatusBar';
import { EditorProvider, useEditor } from './contexts/EditorContext';
import { useFileOperations } from './hooks/useFileOperations';
import { useShortcuts } from './hooks/useShortcuts';
import { isMarkdown, renderMarkdown } from './utils/markdown';
import { isHTML } from './utils/html';

function AppContent() {
  const { editor, setContent, setFilePath, setFileType, setViewMode, setSaveStatus, setIsDirty, resetEditor } = useEditor();
  const { openFile, saveFile, saveAsFile } = useFileOperations();
  const editorRef = useRef<HTMLDivElement>(null);
  const [focusMode, setFocusMode] = useState(false);

  // Convert HTML content to Markdown for source mode
  const htmlToMarkdown = (html: string): string => {
    if (!html) return '';

    // If content doesn't look like HTML, treat as plain text
    if (!/<[a-z][\s\S]*>/i.test(html)) {
      return html;
    }

    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    const lines: string[] = [];

    const walk = (node: Node, indent: string = '') => {
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          let text = child.textContent || '';
          // Skip extra whitespace
          text = text.replace(/\s+/g, ' ');
          if (text.trim()) {
            lines.push(indent + text);
          }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const el = child as HTMLElement;
          const tagName = el.tagName.toLowerCase();

          switch (tagName) {
            case 'h1': lines.push(indent + '# ' + el.textContent); break;
            case 'h2': lines.push(indent + '## ' + el.textContent); break;
            case 'h3': lines.push(indent + '### ' + el.textContent); break;
            case 'h4': lines.push(indent + '#### ' + el.textContent); break;
            case 'h5': lines.push(indent + '##### ' + el.textContent); break;
            case 'h6': lines.push(indent + '###### ' + el.textContent); break;
            case 'p': {
              walk(el, '');
              lines.push('');
              break;
            }
            case 'br': lines.push(''); break;
            case 'strong':
            case 'b': lines.push('**' + el.textContent + '**'); break;
            case 'em':
            case 'i': lines.push('*' + el.textContent + '*'); break;
            case 'u': lines.push('<u>' + el.textContent + '</u>'); break;
            case 'code': lines.push('`' + el.textContent + '`'); break;
            case 'pre': {
              const lang = el.getAttribute('data-lang') || '';
              const code = el.querySelector('code');
              lines.push('```' + lang);
              lines.push(code?.textContent || el.textContent || '');
              lines.push('```');
              lines.push('');
              break;
            }
            case 'blockquote': {
              const text = el.textContent || '';
              text.split('\n').forEach(line => lines.push('> ' + line));
              lines.push('');
              break;
            }
            case 'ul': {
              Array.from(el.children).forEach(li => {
                lines.push(indent + '- ' + li.textContent);
              });
              lines.push('');
              break;
            }
            case 'ol': {
              Array.from(el.children).forEach((li, i) => {
                lines.push(indent + (i + 1) + '. ' + li.textContent);
              });
              lines.push('');
              break;
            }
            case 'hr': lines.push('---'); lines.push(''); break;
            case 'a': lines.push('[' + el.textContent + '](' + el.getAttribute('href') + ')'); break;
            case 'img': lines.push('![' + (el.getAttribute('alt') || '') + '](' + el.getAttribute('src') + ')'); break;
            case 'div': {
              walk(el, indent);
              lines.push('');
              break;
            }
            default: walk(el, indent); break;
          }
        }
      }
    };

    walk(temp);
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  };

  // Convert Markdown to HTML for WYSIWYG mode
  const markdownToHtml = (md: string): string => {
    if (!md) return '';
    // If content looks like HTML, return as-is
    if (/<[a-z][\s\S]*>/i.test(md)) {
      return md;
    }
    return renderMarkdown(md);
  };

  // Handle view mode change - convert content format appropriately
  const handleViewModeChange = useCallback((newMode: 'wysiwyg' | 'source') => {
    if (newMode === editor.viewMode) return;

    if (newMode === 'source') {
      // WYSIWYG -> Source: convert HTML to Markdown
      const md = htmlToMarkdown(editor.content);
      setContent(md);
    } else {
      // Source -> WYSIWYG: convert Markdown to HTML
      const html = markdownToHtml(editor.content);
      setContent(html);
    }

    setViewMode(newMode);
  }, [editor.viewMode, editor.content, setContent, setViewMode]);

  const handleNewFile = useCallback(() => {
    resetEditor();
  }, [resetEditor]);

  const handleOpenFile = useCallback(async () => {
    const result = await openFile();
    if (!result) return;

    let fileType = editor.fileType;
    if (result.fileType === 'markdown' || isMarkdown(result.content)) fileType = 'markdown';
    else if (result.fileType === 'html' || isHTML(result.content)) fileType = 'html';

    // For markdown files, render to HTML for WYSIWYG display
    let displayContent = result.content;
    if (fileType === 'markdown') {
      displayContent = renderMarkdown(result.content);
    }

    setContent(displayContent);
    setFilePath(result.path);
    setFileType(fileType);
    setViewMode('wysiwyg');
    setIsDirty(false);
    setSaveStatus('saved');
  }, [openFile, setContent, setFilePath, setFileType, setViewMode, setIsDirty, setSaveStatus]);

  const handleSaveAs = useCallback(async () => {
    // If in WYSIWYG mode, convert to markdown before saving
    let contentToSave = editor.content;
    if (editor.viewMode === 'wysiwyg') {
      contentToSave = htmlToMarkdown(editor.content);
    }

    const path = await saveAsFile(contentToSave);
    if (path) {
      const ext = path.split('.').pop()?.toLowerCase();
      const fileType = ext === 'md' ? 'markdown' : ext === 'html' || ext === 'htm' ? 'html' : 'text';
      setFilePath(path);
      setFileType(fileType);
      setSaveStatus('saved');
      setIsDirty(false);
    }
  }, [saveAsFile, editor.content, editor.viewMode, setFilePath, setFileType, setSaveStatus, setIsDirty]);

  const handleSave = useCallback(async () => {
    // If in WYSIWYG mode, convert to markdown before saving
    let contentToSave = editor.content;
    if (editor.viewMode === 'wysiwyg') {
      contentToSave = htmlToMarkdown(editor.content);
    }

    if (editor.filePath) {
      await saveFile(editor.filePath, contentToSave);
      setSaveStatus('saved');
      setIsDirty(false);
    } else {
      await handleSaveAs();
    }
  }, [editor.filePath, editor.content, editor.viewMode, saveFile, handleSaveAs, setSaveStatus, setIsDirty]);

  const handleFormatAction = useCallback((action: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    if (editor.viewMode === 'wysiwyg') {
      switch (action) {
        case 'bold':
          document.execCommand('bold');
          break;
        case 'italic':
          document.execCommand('italic');
          break;
        case 'underline':
          document.execCommand('underline');
          break;
        case 'strikethrough':
          document.execCommand('strikeThrough');
          break;
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6': {
          const level = action.slice(1);
          document.execCommand('formatBlock', false, `h${level}`);
          break;
        }
        case 'quote':
          document.execCommand('formatBlock', false, 'blockquote');
          break;
        case 'hr':
          document.execCommand('insertHTML', false, '<hr>');
          break;
        case 'bullet':
          document.execCommand('insertUnorderedList');
          break;
        case 'numbered':
          document.execCommand('insertOrderedList');
          break;
        case 'code':
          formatSelection('`');
          break;
        case 'codeblock': {
          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0) return;
          const range = selection.getRangeAt(0);
          const pre = document.createElement('pre');
          pre.setAttribute('data-lang', '');
          pre.style.cssText = `
            background: var(--bg-secondary);
            padding: 12px;
            border-radius: 4px;
            overflow-x: auto;
          `;
          const code = document.createElement('code');
          code.textContent = 'code';
          pre.appendChild(code);

          range.deleteContents();
          range.insertNode(pre);
          break;
        }
        case 'link': {
          const url = prompt('Enter URL:', 'https://');
          if (url) {
            document.execCommand('createLink', false, url);
          }
          break;
        }
        case 'image': {
          const url = prompt('Enter image URL:', 'https://');
          if (url) {
            document.execCommand('insertHTML', false, `<img src="${url}" alt="image" style="max-width:100%;">`);
          }
          break;
        }
      }
    }
  }, [editor.viewMode]);

  const toggleFocusMode = useCallback(() => {
    setFocusMode((prev) => !prev);
  }, []);

  // Define all keyboard shortcuts
  const shortcuts = useCallback(() => [
    // File operations
    { key: 's', ctrl: true, handler: () => handleSave() },
    { key: 'n', ctrl: true, handler: () => handleNewFile() },
    { key: 'o', ctrl: true, handler: () => handleOpenFile() },

    // Toggle view mode
    { key: '`', ctrl: true, handler: () => handleViewModeChange(editor.viewMode === 'wysiwyg' ? 'source' : 'wysiwyg') },

    // Toggle focus mode
    { key: 'f', ctrl: true, shift: true, handler: () => toggleFocusMode() },

    // Text formatting (WYSIWYG)
    { key: 'b', ctrl: true, handler: () => handleFormatAction('bold') },
    { key: 'i', ctrl: true, handler: () => handleFormatAction('italic') },
    { key: 'u', ctrl: true, handler: () => handleFormatAction('underline') },

    // Headings
    { key: '1', ctrl: true, handler: () => handleFormatAction('h1') },
    { key: '2', ctrl: true, handler: () => handleFormatAction('h2') },
    { key: '3', ctrl: true, handler: () => handleFormatAction('h3') },
    { key: '4', ctrl: true, handler: () => handleFormatAction('h4') },
    { key: '5', ctrl: true, handler: () => handleFormatAction('h5') },
    { key: '6', ctrl: true, handler: () => handleFormatAction('h6') },

    // Block formatting
    { key: 'q', ctrl: true, shift: true, handler: () => handleFormatAction('quote') },

    // Lists
    { key: 'l', ctrl: true, handler: () => handleFormatAction('bullet') },
    { key: 'l', ctrl: true, shift: true, handler: () => handleFormatAction('numbered') },
  ], [handleSave, handleNewFile, handleOpenFile, editor.viewMode, handleViewModeChange, handleFormatAction, toggleFocusMode]);

  useShortcuts(shortcuts());

  const language = editor.fileType === 'markdown' ? 'markdown' : editor.fileType === 'html' ? 'html' : 'plaintext';

  // In WYSIWYG mode, content should already be HTML (converted on mode switch)
  // In Source mode, content should be markdown (converted on mode switch)
  const displayContent = editor.content;

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {!focusMode && <MenuBar />}
      {!focusMode && <DockBar onFormat={handleFormatAction} />}
      <div className="flex flex-1 overflow-hidden">
        {!focusMode && <Sidebar />}
        <div className="flex-1 overflow-hidden" ref={editorRef}>
          {editor.viewMode === 'source' ? (
            <SourceEditor content={displayContent} onChange={(content) => setContent(content)} language={language} />
          ) : (
            <WysiwygEditor key={editor.viewMode} content={displayContent} onChange={(content) => setContent(content)} />
          )}
        </div>
      </div>
      {!focusMode && (
        <StatusBar
          filePath={editor.filePath}
          saveStatus={editor.saveStatus}
          fileType={editor.fileType}
          wordCount={editor.content.length}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <EditorProvider>
      <AppContent />
    </EditorProvider>
  );
}

export default App;