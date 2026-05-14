import { useEffect, useState } from 'react';
import { renderMarkdown } from '../utils/markdown';
import { sanitizeHTML } from '../utils/html';

interface RendererProps {
  content: string;
  fileType: 'markdown' | 'html' | 'text';
}

export function Renderer({ content, fileType }: RendererProps) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    const render = async () => {
      if (fileType === 'markdown') {
        const rendered = await renderMarkdown(content);
        setHtml(rendered);
      } else if (fileType === 'html') {
        setHtml(sanitizeHTML(content));
      } else {
        setHtml(`<pre>${content}</pre>`);
      }
    };
    render();
  }, [content, fileType]);

  return (
    <div 
      className="h-full w-full overflow-auto p-4 prose prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
