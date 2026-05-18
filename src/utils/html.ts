import DOMPurify from 'dompurify';

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html);
}

export function isHTML(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}
