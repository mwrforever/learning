import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({
  breaks: true,
  gfm: true,
});

export function renderMarkdown(markdown: string): string {
  const html = marked.parse(markdown) as string;
  return DOMPurify.sanitize(html);
}

export function isMarkdown(content: string): boolean {
  // If content contains HTML tags, it's not pure markdown
  if (/<[a-z][\s\S]*>/i.test(content)) {
    return false;
  }
  // Check if content has markdown patterns
  return /^#{1,6}\s/m.test(content) ||
    /\*\*.*\*\*/.test(content) ||
    /\[.*\]\(.*\)/.test(content) ||
    /^\s*[-*+]\s/m.test(content) ||
    /^```/m.test(content);
}
