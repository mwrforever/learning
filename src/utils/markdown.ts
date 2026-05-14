import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({ breaks: true, gfm: true });

export async function renderMarkdown(markdown: string): Promise<string> {
  const html = await marked(markdown);
  return DOMPurify.sanitize(html);
}

export function isMarkdown(content: string): boolean {
  return /^#{1,6}\s/m.test(content) || 
         /\*\*.*\*\*/.test(content) || 
         /\[.*\]\(.*\)/.test(content);
}
