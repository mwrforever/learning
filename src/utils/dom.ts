/**
 * HTML to Markdown converter utility
 * Converts HTML nodes back to markdown format
 */

/**
 * Process a single DOM node and convert it to markdown
 */
function processNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || '';
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toLowerCase();

  switch (tagName) {
    case 'h1':
      return '# ' + processNodeContent(element) + '\n\n';
    case 'h2':
      return '## ' + processNodeContent(element) + '\n\n';
    case 'h3':
      return '### ' + processNodeContent(element) + '\n\n';
    case 'h4':
      return '#### ' + processNodeContent(element) + '\n\n';
    case 'h5':
      return '##### ' + processNodeContent(element) + '\n\n';
    case 'h6':
      return '###### ' + processNodeContent(element) + '\n\n';
    case 'p':
      return processNodeContent(element) + '\n\n';
    case 'strong':
    case 'b':
      return '**' + processNodeContent(element) + '**';
    case 'em':
    case 'i':
      return '*' + processNodeContent(element) + '*';
    case 'u':
      return '<u>' + processNodeContent(element) + '</u>';
    case 's':
    case 'del':
      return '~~' + processNodeContent(element) + '~~';
    case 'code':
      if (element.parentElement?.tagName.toLowerCase() === 'pre') {
        return processNodeContent(element);
      }
      return '`' + processNodeContent(element) + '`';
    case 'pre':
      return '```\n' + processNodeContent(element) + '\n```\n\n';
    case 'a':
      return '[' + processNodeContent(element) + '](' + (element.getAttribute('href') || '') + ')';
    case 'img':
      return '![' + (element.getAttribute('alt') || '') + '](' + (element.getAttribute('src') || '') + ')';
    case 'blockquote':
      return '> ' + processNodeContent(element) + '\n\n';
    case 'ul':
      return processListItems(element, false);
    case 'ol':
      return processListItems(element, true);
    case 'li':
      return processNodeContent(element);
    case 'br':
      return '\n';
    case 'hr':
      return '---\n\n';
    case 'div':
    case 'span':
      return processNodeContent(element);
    default:
      return processNodeContent(element);
  }
}

/**
 * Process the content inside an element
 */
function processNodeContent(element: HTMLElement): string {
  let result = '';
  const childNodes = element.childNodes;
  for (let i = 0; i < childNodes.length; i++) {
    result += processNode(childNodes[i]);
  }
  return result;
}

/**
 * Process list items (ul or ol)
 */
function processListItems(element: HTMLElement, ordered: boolean): string {
  let result = '';
  let index = 1;
  const childNodes = element.childNodes;
  for (let i = 0; i < childNodes.length; i++) {
    const child = childNodes[i];
    if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName.toLowerCase() === 'li') {
      const prefix = ordered ? index + '.' : '-';
      const content = processNodeContent(child as HTMLElement).trim();
      result += prefix + ' ' + content + '\n';
      index++;
    }
  }
  return result + '\n';
}

/**
 * Convert HTML string to Markdown
 */
export function htmlToMarkdown(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  let result = '';
  const childNodes = doc.body.childNodes;
  for (let i = 0; i < childNodes.length; i++) {
    result += processNode(childNodes[i]);
  }

  // Normalize multiple newlines to two at most
  return result.replace(/\n{3,}/g, '\n\n').trim();
}