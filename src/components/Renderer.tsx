import { useEffect, useState } from 'react';
import { renderMarkdown } from '../utils/markdown';
import { sanitizeHTML } from '../utils/html';
import { Theme } from '../types';

interface RendererProps {
  content: string;
  fileType: 'markdown' | 'html' | 'text';
  theme: Theme;
}

export function Renderer({ content, fileType, theme }: RendererProps) {
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
      className={`h-full w-full overflow-auto p-8 max-w-none ${
        theme === 'dark' 
          ? 'prose prose-invert prose-headings:text-gray-100 prose-p:text-gray-300 prose-strong:text-gray-100 prose-code:text-gray-100' 
          : 'prose prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:text-gray-900'
      }`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
