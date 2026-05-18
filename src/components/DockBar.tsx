import { applyFormat, formatSelection } from './WysiwygEditor';

interface DockBarProps {
  className?: string;
  onFormat?: (action: string) => void;
}

export function DockBar({ className = '', onFormat }: DockBarProps) {
  const handleFormat = (action: string) => {
    if (onFormat) {
      onFormat(action);
      return;
    }

    // Default formatting actions
    switch (action) {
      case 'bold':
        applyFormat('bold');
        break;
      case 'italic':
        applyFormat('italic');
        break;
      case 'underline':
        applyFormat('underline');
        break;
      case 'strikethrough':
        applyFormat('strikeThrough');
        break;
      case 'h1':
        applyFormat('formatBlock', '<h1>');
        break;
      case 'h2':
        applyFormat('formatBlock', '<h2>');
        break;
      case 'h3':
        applyFormat('formatBlock', '<h3>');
        break;
      case 'quote':
        applyFormat('formatBlock', '<blockquote>');
        break;
      case 'hr':
        applyFormat('insertHTML', '<hr>');
        break;
      case 'bullet':
        applyFormat('insertUnorderedList');
        break;
      case 'numbered':
        applyFormat('insertOrderedList');
        break;
      case 'code':
        formatSelection('`');
        break;
      case 'link': {
        const url = prompt('Enter URL:', 'https://');
        if (url) {
          applyFormat('createLink', url);
        }
        break;
      }
      case 'image': {
        const url = prompt('Enter image URL:', 'https://');
        if (url) {
          applyFormat('insertHTML', `<img src="${url}" alt="image">`);
        }
        break;
      }
    }
  };

  return (
    <div
      className={`flex items-center h-10 px-2 gap-1 bg-[var(--bg-secondary)] border-b border-[var(--border)] ${className}`}
      style={{ fontSize: '12px' }}
    >
      {/* Text Format */}
      <button
        onClick={() => handleFormat('bold')}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--hover-bg)] font-bold"
        style={{ color: 'var(--text-primary)' }}
        title="Bold (Ctrl+B)"
      >
        B
      </button>
      <button
        onClick={() => handleFormat('italic')}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--hover-bg)] italic"
        style={{ color: 'var(--text-primary)' }}
        title="Italic (Ctrl+I)"
      >
        I
      </button>
      <button
        onClick={() => handleFormat('underline')}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--hover-bg)] underline"
        style={{ color: 'var(--text-primary)' }}
        title="Underline (Ctrl+U)"
      >
        U
      </button>
      <button
        onClick={() => handleFormat('strikethrough')}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--hover-bg)] line-through"
        style={{ color: 'var(--text-primary)' }}
        title="Strikethrough"
      >
        S
      </button>

      <div className="w-px h-6 bg-[var(--border)] mx-1" />

      {/* Headings */}
      <button
        onClick={() => handleFormat('h1')}
        className="px-2 h-8 flex items-center justify-center rounded hover:bg-[var(--hover-bg)] font-semibold"
        style={{ color: 'var(--text-primary)' }}
        title="Heading 1 (Ctrl+1)"
      >
        H1
      </button>
      <button
        onClick={() => handleFormat('h2')}
        className="px-2 h-8 flex items-center justify-center rounded hover:bg-[var(--hover-bg)] font-semibold"
        style={{ color: 'var(--text-primary)' }}
        title="Heading 2 (Ctrl+2)"
      >
        H2
      </button>
      <button
        onClick={() => handleFormat('h3')}
        className="px-2 h-8 flex items-center justify-center rounded hover:bg-[var(--hover-bg)] font-semibold"
        style={{ color: 'var(--text-primary)' }}
        title="Heading 3 (Ctrl+3)"
      >
        H3
      </button>

      <div className="w-px h-6 bg-[var(--border)] mx-1" />

      {/* Block Elements */}
      <button
        onClick={() => handleFormat('quote')}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--hover-bg)]"
        style={{ color: 'var(--text-primary)' }}
        title="Quote (Ctrl+Shift+Q)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
        </svg>
      </button>
      <button
        onClick={() => handleFormat('hr')}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--hover-bg)]"
        style={{ color: 'var(--text-primary)' }}
        title="Horizontal Line"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12" />
        </svg>
      </button>

      <div className="w-px h-6 bg-[var(--border)] mx-1" />

      {/* Lists */}
      <button
        onClick={() => handleFormat('bullet')}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--hover-bg)]"
        style={{ color: 'var(--text-primary)' }}
        title="Bullet List (Ctrl+Shift+U)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="4" cy="6" r="2" />
          <circle cx="4" cy="12" r="2" />
          <circle cx="4" cy="18" r="2" />
          <rect x="8" y="5" width="12" height="2" />
          <rect x="8" y="11" width="12" height="2" />
          <rect x="8" y="17" width="12" height="2" />
        </svg>
      </button>
      <button
        onClick={() => handleFormat('numbered')}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--hover-bg)]"
        style={{ color: 'var(--text-primary)' }}
        title="Numbered List (Ctrl+Shift+O)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <text x="2" y="8" fontSize="8" fontWeight="bold">1</text>
          <text x="2" y="14" fontSize="8" fontWeight="bold">2</text>
          <text x="2" y="20" fontSize="8" fontWeight="bold">3</text>
          <rect x="8" y="5" width="12" height="2" />
          <rect x="8" y="11" width="12" height="2" />
          <rect x="8" y="17" width="12" height="2" />
        </svg>
      </button>

      <div className="w-px h-6 bg-[var(--border)] mx-1" />

      {/* Inline Elements */}
      <button
        onClick={() => handleFormat('code')}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--hover-bg)] font-mono"
        style={{ color: 'var(--text-primary)' }}
        title="Code (Ctrl+`)"
      >
        {'</>'}
      </button>
      <button
        onClick={() => handleFormat('link')}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--hover-bg)]"
        style={{ color: 'var(--text-primary)' }}
        title="Link (Ctrl+K)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 14a4 4 0 0 0 4 4h4a4 4 0 0 0 0-8h-4a4 4 0 0 0-4 4" />
          <path d="M14 10a4 4 0 0 0-8 0v4a4 4 0 0 0 8 0" transform="rotate(180 10 12)" />
        </svg>
      </button>
      <button
        onClick={() => handleFormat('image')}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--hover-bg)]"
        style={{ color: 'var(--text-primary)' }}
        title="Image"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </button>
    </div>
  );
}