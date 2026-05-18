import React, { useRef, useEffect, useCallback } from 'react';
import hljs from 'highlight.js';

interface WysiwygEditorProps {
  content: string;
  onChange: (value: string) => void;
  fileType?: 'markdown' | 'html' | 'text';
}

// Debounce hook
function useDebounce<T extends (...args: unknown[]) => void>(callback: T, delay: number): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      callback(...args);
      timeoutRef.current = null;
    }, delay);
  }, [callback, delay]) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

// Language options for code blocks
const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp',
  'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala',
  'html', 'css', 'scss', 'less', 'json', 'xml', 'yaml', 'markdown',
  'sql', 'bash', 'shell', 'powershell', 'dockerfile',
  'react', 'vue', 'angular', 'svelte',
  'plaintext'
].sort();

export const WysiwygEditor = React.memo(function WysiwygEditor({
  content,
  onChange,
}: WysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastContentRef = useRef(content);
  const isRenderingRef = useRef(false);

  // Load content when prop changes
  useEffect(() => {
    if (!editorRef.current) return;
    if (isRenderingRef.current) return;
    if (content === lastContentRef.current) return;

    isRenderingRef.current = true;

    // Content should already be HTML at this point (set by handleViewModeChange)
    // Just use it directly - don't re-render markdown
    editorRef.current.innerHTML = content;
    lastContentRef.current = content;

    // Attach language selectors to code blocks
    attachLangSelectors();

    // Focus and place cursor at end
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
      isRenderingRef.current = false;
    }, 0);
  }, [content]);

  // Attach language selector input to code blocks
  const attachLangSelectors = () => {
    if (!editorRef.current) return;
    const codeBlocks = editorRef.current.querySelectorAll('pre[data-lang]');
    codeBlocks.forEach((block) => {
      if (!block.querySelector('.lang-input-container')) {
        const preBlock = block as HTMLElement;
        const container = document.createElement('div');
        container.className = 'lang-input-container';
        container.style.cssText = `
          position: absolute;
          top: 4px;
          right: 8px;
          z-index: 10;
        `;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'lang-selector-input';
        input.placeholder = '语言...';
        input.style.cssText = `
          width: 80px;
          padding: 2px 6px;
          font-size: 11px;
          border: 1px solid var(--border);
          border-radius: 4px;
          background: var(--bg-primary);
          color: var(--text-secondary);
        `;

        const currentLang = preBlock.getAttribute('data-lang') || '';
        if (currentLang) {
          input.value = currentLang;
          input.placeholder = currentLang;
        }

        input.addEventListener('focus', (e) => {
          e.preventDefault();
          e.stopPropagation();
          preBlock.setAttribute('data-editing-lang', 'true');
          showLangPopup(preBlock, input.value);
        });

        input.addEventListener('input', (e) => {
          const pre = (e.target as HTMLInputElement).closest('pre');
          if (pre) {
            const lang = (e.target as HTMLInputElement).value;
            pre.setAttribute('data-lang', lang);
            highlightCode(pre, lang);
          }
        });

        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        });

        container.appendChild(input);
        preBlock.style.position = 'relative';
        preBlock.appendChild(container);
      }
    });
  };

  const highlightCode = (preBlock: HTMLElement, lang: string) => {
    const codeEl = preBlock.querySelector('code');
    if (!codeEl) return;

    if (lang && lang !== 'plaintext') {
      try {
        const highlighted = hljs.highlight(codeEl.textContent || '', { language: lang }).value;
        codeEl.innerHTML = highlighted;
        codeEl.className = `hljs language-${lang}`;
      } catch {
        // Keep original
      }
    }
  };

  const showLangPopup = (preBlock: HTMLElement, currentLang: string) => {
    // Create or update popup
    let popup = document.querySelector('.lang-popup') as HTMLElement;
    if (popup) popup.remove();

    popup = document.createElement('div');
    popup.className = 'lang-popup';
    popup.style.cssText = `
      position: fixed;
      background: var(--bg-primary);
      border: 1px solid var(--border);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      width: 200px;
      max-height: 300px;
      z-index: 10000;
      overflow: hidden;
    `;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '搜索语言...';
    input.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      border: none;
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
      color: var(--text-primary);
      font-size: 14px;
      outline: none;
    `;

    const list = document.createElement('div');
    list.style.cssText = 'max-height: 250px; overflow-y: auto;';

    const rect = preBlock.getBoundingClientRect();
    popup.style.left = `${rect.left + rect.width - 220}px`;
    popup.style.top = `${rect.top}px`;

    const updateList = (search: string) => {
      list.innerHTML = '';
      const filtered = LANGUAGES.filter(l => l.toLowerCase().includes(search.toLowerCase()));
      filtered.forEach(lang => {
        const item = document.createElement('div');
        item.style.cssText = 'padding: 8px 12px; cursor: pointer; color: var(--text-primary);';
        item.textContent = lang;
        if (lang === currentLang) {
          item.style.background = 'var(--hover-bg)';
        }
        item.addEventListener('mouseenter', () => item.style.background = 'var(--hover-bg)');
        item.addEventListener('mouseleave', () => item.style.background = 'transparent');
        item.addEventListener('click', () => {
          preBlock.setAttribute('data-lang', lang);
          const inputEl = preBlock.querySelector('.lang-selector-input') as HTMLInputElement;
          if (inputEl) {
            inputEl.value = lang;
            inputEl.placeholder = lang;
          }
          highlightCode(preBlock, lang);
          popup?.remove();
        });
        list.appendChild(item);
      });
    };

    input.addEventListener('input', () => updateList(input.value));
    updateList('');

    popup.appendChild(input);
    popup.appendChild(list);
    document.body.appendChild(popup);

    input.focus();

    const closePopup = (e: MouseEvent) => {
      if (!popup?.contains(e.target as Node) && !preBlock.contains(e.target as Node)) {
        popup?.remove();
        document.removeEventListener('click', closePopup);
      }
    };
    setTimeout(() => document.addEventListener('click', closePopup), 0);
  };

  const handleInput = useCallback(() => {
    if (!editorRef.current || isRenderingRef.current) return;

    const html = editorRef.current.innerHTML;
    lastContentRef.current = html;
    onChange(html);
  }, [onChange]);

  const debouncedHandleInput = useDebounce(handleInput, 300);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;

    switch (e.key.toLowerCase()) {
      case 'b':
        e.preventDefault();
        document.execCommand('bold');
        break;
      case 'i':
        e.preventDefault();
        document.execCommand('italic');
        break;
      case 'u':
        e.preventDefault();
        document.execCommand('underline');
        break;
      case 'k':
        e.preventDefault();
        const url = prompt('Enter URL:', 'https://');
        if (url) {
          document.execCommand('createLink', false, url);
        }
        break;
      case '`': {
        e.preventDefault();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        const selectedText = selection.toString();
        const text = document.createTextNode('`' + selectedText + '`');
        range.deleteContents();
        range.insertNode(text);
        const newRange = document.createRange();
        newRange.selectNode(text);
        newRange.setStart(text, 1);
        newRange.setEnd(text, text.length - 1);
        selection.removeAllRanges();
        selection.addRange(newRange);
        break;
      }
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6': {
        e.preventDefault();
        const level = e.key;
        document.execCommand('formatBlock', false, `h${level}`);
        break;
      }
    }
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        ref={editorRef}
        data-wysiwyg
        contentEditable
        suppressContentEditableWarning
        className="h-full w-full overflow-auto p-8 outline-none"
        style={{
          fontSize: '16px',
          lineHeight: '1.8',
          maxWidth: '900px',
          margin: '0 auto',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
        }}
        onInput={debouncedHandleInput}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
});

// Export applyFormat and formatSelection for use by DockBar
export function applyFormat(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export function formatSelection(prefix: string, suffix: string = prefix) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const selectedText = selection.toString();

  const text = document.createTextNode(prefix + selectedText + suffix);
  range.deleteContents();
  range.insertNode(text);

  const newRange = document.createRange();
  newRange.selectNode(text);
  newRange.setStart(text, prefix.length);
  newRange.setEnd(text, text.length - suffix.length);
  selection.removeAllRanges();
  selection.addRange(newRange);
}

export function insertCodeBlock(lang: string = '') {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const pre = document.createElement('pre');
  pre.setAttribute('data-lang', lang);
  pre.style.cssText = `
    background: var(--bg-secondary);
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
  `;

  const code = document.createElement('code');
  code.textContent = '';
  if (lang && lang !== 'plaintext') {
    code.className = `language-${lang}`;
  }
  pre.appendChild(code);

  range.deleteContents();
  range.insertNode(pre);

  // Move cursor inside code
  const newRange = document.createRange();
  newRange.setStart(code, 0);
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
}